"""Run the loop against FakeLLMClient to sanity-check the wiring end to end.

python -m agent.demo
"""

from __future__ import annotations

import json
import logging

from .llm_client import FakeLLMClient
from .loop import run_agent_loop


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    print("--- spray path ---")
    result = run_agent_loop("F0412-Z007", FakeLLMClient())
    print(json.dumps(result, indent=2))

    print("\n--- rules engine overrides a low-confidence spray to re-scout ---")
    low_confidence_client = FakeLLMClient(
        final_args={
            "zone_id": "F0412-Z099",
            "decision": "spray",
            "strategy": "spot",
            "buffer_rings": 0,
            "rescout_in_days": 7,
            "reason": "Weeds detected above threshold.",
            "estimated_savings_usd": 9.10,
        }
    )
    result = run_agent_loop("F0412-Z099", low_confidence_client)
    print(json.dumps(result, indent=2))

    print("\n--- escalate path ---")
    escalate_client = FakeLLMClient(
        final_tool="escalate",
        final_args={"zone_id": "F0412-Z150", "reason": "Conflicting detections; needs an agronomist."},
    )
    result = run_agent_loop("F0412-Z150", escalate_client)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
