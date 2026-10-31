"""LLM backends for the zone-decision agent.

Any client just needs a `.chat(messages, tools) -> message` method that speaks
OpenAI-style tool calling, since vLLM and llama.cpp both serve that API shape
for Gemma 4. `FakeLLMClient` scripts a plausible tool-call sequence so the
loop and rules engine can be exercised without a live model.
"""

from __future__ import annotations

import json
import uuid
from typing import Protocol


class LLMClient(Protocol):
    def chat(self, messages: list[dict], tools: list[dict]) -> dict:
        """Returns an OpenAI-style assistant message, possibly with tool_calls."""
        ...


def _tool_call(name: str, arguments: dict) -> dict:
    return {
        "id": f"call_{uuid.uuid4().hex[:8]}",
        "type": "function",
        "function": {"name": name, "arguments": json.dumps(arguments)},
    }


class VLLMClient:
    """Thin wrapper around an OpenAI-compatible endpoint (vLLM or llama.cpp
    serving Gemma 4). Swap in for FakeLLMClient once a model is deployed.
    """

    def __init__(self, base_url: str, model: str, api_key: str = "not-needed"):
        from openai import OpenAI  # local import: optional dependency

        self._client = OpenAI(base_url=base_url, api_key=api_key)
        self._model = model

    def chat(self, messages: list[dict], tools: list[dict]) -> dict:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=0.0,
        )
        return response.choices[0].message.model_dump()


class GeminiClient:
    """Wraps the Gemini API's generateContent endpoint to serve Gemma 4
    models (e.g. gemma-4-31b-it) behind the same chat(messages, tools)
    interface as VLLMClient.
    """

    def __init__(self, model: str = "gemma-4-31b-it", api_key: str | None = None):
        from google import genai  # local import: optional dependency

        self._client = genai.Client(api_key=api_key)
        self._model = model

    def chat(self, messages: list[dict], tools: list[dict]) -> dict:
        # Gemma 4 returns a 500 if config.system_instruction is combined with
        # tools, so fold it into the conversation as a leading turn instead.
        contents: list[dict] = []
        for msg in messages:
            role = msg["role"]
            if role == "system":
                contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
                contents.append({"role": "model", "parts": [{"text": "Understood."}]})
            elif role == "user":
                contents.append({"role": "user", "parts": [{"text": msg["content"]}]})
            elif role == "assistant":
                parts = []
                if msg.get("content"):
                    parts.append({"text": msg["content"]})
                for call in msg.get("tool_calls") or []:
                    parts.append(
                        {
                            "functionCall": {
                                "name": call["function"]["name"],
                                "args": json.loads(call["function"]["arguments"]),
                            }
                        }
                    )
                contents.append({"role": "model", "parts": parts})
            elif role == "tool":
                part = {
                    "functionResponse": {
                        "name": msg["name"],
                        "response": json.loads(msg["content"]),
                    }
                }
                # Parallel tool calls must come back as one user turn with
                # multiple parts, not several consecutive turns.
                if contents and contents[-1]["role"] == "user" and all(
                    "functionResponse" in p for p in contents[-1]["parts"]
                ):
                    contents[-1]["parts"].append(part)
                else:
                    contents.append({"role": "user", "parts": [part]})

        function_declarations = [
            {
                "name": t["function"]["name"],
                "description": t["function"]["description"],
                "parameters": t["function"]["parameters"],
            }
            for t in tools
        ]

        response = self._client.models.generate_content(
            model=self._model,
            contents=contents,
            config={"tools": [{"function_declarations": function_declarations}]},
        )

        parts = response.candidates[0].content.parts
        tool_calls = [
            {
                "id": f"call_{uuid.uuid4().hex[:8]}",
                "type": "function",
                "function": {
                    "name": part.function_call.name,
                    "arguments": json.dumps(dict(part.function_call.args)),
                },
            }
            for part in parts
            if getattr(part, "function_call", None)
        ]
        text = "".join(part.text for part in parts if getattr(part, "text", None))
        return {"role": "assistant", "content": text or None, "tool_calls": tool_calls}


class ClaudeClient:
    """Wraps the Claude API's Messages endpoint behind the same
    chat(messages, tools) interface as VLLMClient and GeminiClient.
    """

    def __init__(self, model: str = "claude-opus-4-8", api_key: str | None = None):
        from anthropic import Anthropic  # local import: optional dependency

        self._client = Anthropic(api_key=api_key)
        self._model = model

    def chat(self, messages: list[dict], tools: list[dict]) -> dict:
        system = None
        claude_messages: list[dict] = []
        for msg in messages:
            role = msg["role"]
            if role == "system":
                system = msg["content"]
            elif role == "user":
                claude_messages.append({"role": "user", "content": msg["content"]})
            elif role == "assistant":
                content = []
                if msg.get("content"):
                    content.append({"type": "text", "text": msg["content"]})
                for call in msg.get("tool_calls") or []:
                    content.append(
                        {
                            "type": "tool_use",
                            "id": call["id"],
                            "name": call["function"]["name"],
                            "input": json.loads(call["function"]["arguments"]),
                        }
                    )
                claude_messages.append({"role": "assistant", "content": content})
            elif role == "tool":
                part = {
                    "type": "tool_result",
                    "tool_use_id": msg["tool_call_id"],
                    "content": msg["content"],
                }
                if claude_messages and claude_messages[-1]["role"] == "user" and all(
                    isinstance(p, dict) and p.get("type") == "tool_result" for p in claude_messages[-1]["content"]
                ):
                    claude_messages[-1]["content"].append(part)
                else:
                    claude_messages.append({"role": "user", "content": [part]})

        claude_tools = [
            {
                "name": t["function"]["name"],
                "description": t["function"]["description"],
                "input_schema": t["function"]["parameters"],
            }
            for t in tools
        ]

        response = self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=system,
            messages=claude_messages,
            tools=claude_tools,
        )

        text = "".join(block.text for block in response.content if block.type == "text")
        tool_calls = [
            {
                "id": block.id,
                "type": "function",
                "function": {"name": block.name, "arguments": json.dumps(block.input)},
            }
            for block in response.content
            if block.type == "tool_use"
        ]
        return {"role": "assistant", "content": text or None, "tool_calls": tool_calls}


class FakeLLMClient:
    """Scripts a realistic evidence-gathering sequence, ending in a terminal
    tool call. Useful for testing the loop and rules engine in isolation.
    """

    def __init__(self, final_tool: str = "write_decision", final_args: dict | None = None):
        self._final_tool = final_tool
        self._final_args = final_args or {
            "zone_id": "F0412-Z007",
            "decision": "spray",
            "strategy": "buffered_spot",
            "buffer_rings": 1,
            "rescout_in_days": 5,
            "reason": "Defoliation exceeds the R1 action threshold and weather allows application.",
            "estimated_savings_usd": 18.40,
        }
        self._step = 0

    def chat(self, messages: list[dict], tools: list[dict]) -> dict:
        zone_id = self._final_args.get("zone_id", "F0412-Z007")
        field_id = zone_id.split("-")[0]
        script = [
            [_tool_call("get_zone", {"zone_id": zone_id})],
            [
                _tool_call("crop_stage", {"field_id": field_id}),
                _tool_call("weather", {"field_id": field_id, "hours": 48}),
            ],
            [_tool_call(self._final_tool, self._final_args)],
        ]
        step = min(self._step, len(script) - 1)
        tool_calls = script[step]
        self._step += 1
        return {"role": "assistant", "content": None, "tool_calls": tool_calls}
