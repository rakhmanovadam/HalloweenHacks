"""Deterministic checks that gate every agent decision before it is final.

Per the PRD: "the agent proposes, these checks decide." This module re-fetches
weather, label rules and coverage itself rather than trusting the agent's own
tool-call transcript, so a confused or manipulated agent can't talk its way
past a safety check by misreporting what a tool returned.
"""

from __future__ import annotations

from . import tools

DEFAULT_PRODUCT = "generic"
MAX_WIND_MPH_FALLBACK = 10
CONFIDENCE_DECIDE_THRESHOLD = 0.65
BROADCAST_SHARE_THRESHOLD = 0.60
ABIOTIC_BLOCK_THRESHOLD = 0.5


def _override(decision: dict, reason: str, new_decision: str = "re-scout") -> dict:
    decision = dict(decision)
    decision["decision"] = new_decision
    decision["overridden"] = True
    decision["override_reason"] = reason
    return decision


def apply_rules(decision: dict, product: str = DEFAULT_PRODUCT) -> dict:
    decision = dict(decision, overridden=False, override_reason=None)
    zone_id = decision["zone_id"]
    field_id = zone_id.split("-")[0]

    if decision["decision"] != "spray":
        return decision

    zone = tools.get_zone(zone_id)
    detections = zone.get("detections", {})
    top_class = detections.get("class")
    confidence = detections.get("confidence", 0.0)

    if top_class == "dehydration" and confidence >= ABIOTIC_BLOCK_THRESHOLD:
        return _override(decision, "classifier says dehydration (abiotic): not treatable by pesticide", "skip")

    if confidence < CONFIDENCE_DECIDE_THRESHOLD:
        return _override(decision, f"classifier confidence {confidence} below {CONFIDENCE_DECIDE_THRESHOLD}: too low to spray")

    weather_forecast = tools.weather(field_id, hours=48)
    label = tools.label_rules(product)

    if weather_forecast["rain_prob_24h"] > 0.5:
        return _override(decision, "rain forecast within label's rain-free window", "re-scout")

    max_wind = label.get("max_wind_mph", MAX_WIND_MPH_FALLBACK)
    if weather_forecast["wind_mph"] > max_wind:
        return _override(decision, f"forecast wind {weather_forecast['wind_mph']} mph exceeds label max {max_wind} mph", "re-scout")

    coverage = tools.zone_coverage_share(field_id, [zone_id])
    if coverage["share"] > BROADCAST_SHARE_THRESHOLD:
        decision["strategy"] = "broadcast"
        decision["override_reason"] = (
            f"treated share {coverage['share']:.0%} exceeds {BROADCAST_SHARE_THRESHOLD:.0%}: switched spot plan to broadcast"
        )
        decision["overridden"] = True

    return decision
