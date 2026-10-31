"""The zone-decision agent's reasoning loop.

Seeds the conversation with a zone_id, lets the model call read-only tools to
gather evidence, and stops as soon as it calls a terminal tool
(write_decision or escalate). The terminal call is then re-checked by the
deterministic rules engine before anything is returned to the caller.
"""

from __future__ import annotations

import json
import logging

from . import rules_engine
from .llm_client import LLMClient
from .tools import TERMINAL_TOOLS, TOOL_REGISTRY, TOOL_SCHEMAS

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 8

SYSTEM_PROMPT = """You are FieldGrid's zone-decision agent.

For the given zone, gather whatever evidence you need via tool calls, then
finish by calling exactly one terminal tool: write_decision or escalate.

The CV classifier (ConvNeXt-Tiny close-up model, see ml/README.md) reports one
of 5 classes -- healthy, weed, disease, insect_damage, other -- with a
confidence score and the full probability distribution across all 5 classes.
It does not report species or a severity percentage.

"disease" is a catch-all for fungal, bacterial and viral symptoms alike; a
fungicide only helps the fungal subset, so treat a "disease" top class as
weaker evidence for spraying than "weed" or "insect_damage" at the same
confidence -- prefer re-scout when disease confidence is only moderate.

Hard constraints (a rules engine will also enforce these independently):
- Never set a chemical product or application rate yourself.
- If confidence is below 0.65, you may not call write_decision with decision="spray";
  choose re-scout or escalate instead.
- If the top class is "other" with confidence 0.5 or higher, call escalate, not
  write_decision with skip -- "other" means ambiguous/unrecognized and needs a
  person, not "no problem found."
- species_tolerance cannot fire yet (no species-level detection exists); ignore it
  until the model reports species.
- If zone_coverage_share indicates treated area would exceed 60% of the field,
  prefer strategy="broadcast" over a spot strategy.
- Check weather before recommending spray; rain or high wind in the label's
  window should produce re-scout instead.

Call write_decision with: zone_id, decision, strategy, buffer_rings,
rescout_in_days, reason (one or two plain sentences), estimated_savings_usd.
Call escalate with: zone_id, reason — use this when you cannot decide safely.
"""


class AgentLoopError(RuntimeError):
    pass


def run_agent_loop(zone_id: str, llm_client: LLMClient, product: str = "generic") -> dict:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps({"zone_id": zone_id})},
    ]

    for step in range(MAX_ITERATIONS):
        response = llm_client.chat(messages=messages, tools=TOOL_SCHEMAS)
        messages.append(response)

        tool_calls = response.get("tool_calls") or []
        if not tool_calls:
            raise AgentLoopError(
                f"zone {zone_id}: model returned no tool call and no terminal decision at step {step}"
            )

        for call in tool_calls:
            name = call["function"]["name"]
            raw_args = call["function"].get("arguments") or "{}"
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError as exc:
                raise AgentLoopError(f"zone {zone_id}: malformed tool arguments for {name}: {raw_args}") from exc

            if name not in TOOL_REGISTRY:
                result = {"error": f"unknown tool {name}"}
            else:
                logger.info("zone %s step %d: calling %s(%s)", zone_id, step, name, args)
                result = TOOL_REGISTRY[name](**args)

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": call["id"],
                    "name": name,
                    "content": json.dumps(result),
                }
            )

            if name in TERMINAL_TOOLS:
                return _finalize(name, result, product)

    raise AgentLoopError(f"zone {zone_id}: exceeded {MAX_ITERATIONS} iterations without a decision")


def _finalize(terminal_tool: str, result: dict, product: str) -> dict:
    if terminal_tool == "escalate":
        return result
    return rules_engine.apply_rules(result, product=product)
