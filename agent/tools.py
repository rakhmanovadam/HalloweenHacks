"""Stub implementations of every tool the zone-decision agent can call.

Each function's signature and return shape is the contract the real
implementation (PostGIS queries, the segmentation model's stored output,
an extension-guidance table, a weather API, etc.) must honor. Swap the body,
keep the signature, and the loop/rules-engine code does not change.
"""

from __future__ import annotations

import hashlib
import random


def _rng(*parts: str) -> random.Random:
    seed = int(hashlib.sha256("|".join(parts).encode()).hexdigest(), 16) % (2**32)
    return random.Random(seed)


def get_zone(zone_id: str) -> dict:
    rng = _rng("zone", zone_id)
    n_cells = rng.randint(1, 6)
    cells = [
        {
            "cell_id": f"{zone_id}-c{i}",
            "ndvi_mean": round(rng.uniform(0.4, 0.8), 2),
            "ndvi_delta": round(rng.uniform(-0.3, 0.0), 2),
            "anomaly_score": round(rng.uniform(0.5, 1.0), 2),
            "is_edge": rng.random() < 0.2,
        }
        for i in range(n_cells)
    ]
    return {
        "zone_id": zone_id,
        "field_id": zone_id.split("-")[0],
        "cells": cells,
        "area_m2": n_cells * 100,
        "edge_context": rng.choice(["none", "woods_north", "road_east", "water_south"]),
        # Shape matches ml/predict.py's real output (ConvNeXt-Tiny close-up
        # classifier, see ml/README.md): top-1 class + confidence, plus the
        # full softmax over all 5 classes. IR/NDVI never enters this model --
        # it stays in the cell-level fields above, computed separately.
        "detections": _fake_classification(rng),
    }


_CLOSEUP_CLASSES = ["healthy", "weed", "disease", "insect_damage", "other"]


def _fake_classification(rng: random.Random) -> dict:
    raw = [rng.random() for _ in _CLOSEUP_CLASSES]
    total = sum(raw)
    probs = {c: round(p / total, 3) for c, p in zip(_CLOSEUP_CLASSES, raw)}
    best = max(probs, key=probs.get)
    return {"class": best, "confidence": probs[best], "probs": probs}


def cell_history(cell_id: str, n: int = 3) -> dict:
    rng = _rng("cell_history", cell_id)
    return {
        "cell_id": cell_id,
        "flights": [
            {
                "flight_date": f"2026-0{6 + i}-01",
                "ndvi_mean": round(rng.uniform(0.4, 0.8), 2),
                "anomaly_score": round(rng.uniform(0.0, 1.0), 2),
                "decision": rng.choice(["spray", "skip", "re-scout"]),
            }
            for i in range(n)
        ],
    }


def sample_images(zone_id: str, k: int = 3) -> dict:
    rng = _rng("images", zone_id)
    return {
        "zone_id": zone_id,
        "images": [
            {
                "cell_id": f"{zone_id}-c{i}",
                "url": f"https://storage.fieldgrid.ag/inspection/{zone_id}/{i}.jpg",
                "captured_at": "2026-07-14T11:32:00Z",
            }
            for i in rng.sample(range(k * 2), k)
        ],
    }


def crop_stage(field_id: str) -> dict:
    rng = _rng("stage", field_id)
    return {
        "field_id": field_id,
        "crop": "soybean",
        "stage": rng.choice(["V4", "V6", "R1", "R2", "R3"]),
        "growing_degree_days": rng.randint(600, 1400),
    }


def economic_threshold(crop: str, problem: str, stage: str) -> dict:
    rng = _rng("threshold", crop, problem, stage)
    return {
        "crop": crop,
        "problem": problem,
        "stage": stage,
        "action_threshold_pct": round(rng.uniform(10, 30), 1),
        "source": "extension_guidance_table_v1",
    }


def species_tolerance(species: str) -> dict:
    # The v1 classifier only outputs {weeds, disease, dehydration, insects, healthy} --
    # no species label -- so nothing can call this with a real species yet.
    # Kept so the agent/loop don't need to change shape once species ID ships.
    zero_tolerance = {"palmer_amaranth", "waterhemp"}
    return {
        "species": species,
        "zero_tolerance": species in zero_tolerance,
    }


def pest_mobility(problem: str) -> dict:
    # "insect_damage" has one entry because the classifier doesn't distinguish
    # species (aphids vs. stink bugs have very different mobility); this
    # default is a coarse placeholder until species-level ID exists.
    table = {
        "weed": {"mobility": "none", "default_buffer_rings": 0},
        "disease": {"mobility": "low", "default_buffer_rings": 1},
        "insect_damage": {"mobility": "high", "default_buffer_rings": 2},
    }
    result = table.get(problem, {"mobility": "unknown", "default_buffer_rings": 1})
    return {"problem": problem, **result}


def weather(field_id: str, hours: int = 48) -> dict:
    rng = _rng("weather", field_id, str(hours))
    return {
        "field_id": field_id,
        "horizon_hours": hours,
        "rain_prob_24h": round(rng.uniform(0.0, 0.5), 2),
        "wind_mph": round(rng.uniform(2, 12), 1),
        "temperature_f": round(rng.uniform(65, 90), 1),
    }


def label_rules(product: str) -> dict:
    rng = _rng("label", product)
    return {
        "product": product,
        "max_rate_per_acre": round(rng.uniform(0.5, 2.0), 2),
        "seasonal_max_applications": rng.randint(1, 3),
        "pre_harvest_interval_days": rng.randint(7, 30),
        "max_wind_mph": 10,
        "rain_free_hours_required": rng.randint(1, 6),
        "buffer_distance_ft": {"water": 25, "homes": 50},
    }


def field_history(field_id: str) -> dict:
    rng = _rng("field_history", field_id)
    return {
        "field_id": field_id,
        "applications": [
            {
                "product": rng.choice(["glyphosate", "dicamba", "lambda-cyhalothrin"]),
                "date": "2026-06-20",
                "zones": [f"{field_id}-Z{rng.randint(1, 20):03d}"],
            }
        ],
    }


def zone_coverage_share(field_id: str, candidate_zones: list[str]) -> dict:
    rng = _rng("coverage", field_id, "".join(candidate_zones))
    return {
        "field_id": field_id,
        "candidate_zones": candidate_zones,
        "share": round(rng.uniform(0.02, 0.75), 3),
    }


def neighboring_zone_diagnoses(zone_id: str) -> dict:
    rng = _rng("neighbors", zone_id)
    return {
        "zone_id": zone_id,
        "neighbors": [
            {
                "zone_id": f"{zone_id}-n{i}",
                "diagnosis": rng.choice(_CLOSEUP_CLASSES),
                "decision": rng.choice(["spray", "skip", None]),
            }
            for i in range(rng.randint(0, 3))
        ],
    }


def estimate_savings(zone_plan: dict) -> dict:
    rng = _rng("savings", str(zone_plan.get("zone_id", "")))
    area_m2 = zone_plan.get("area_m2", 100)
    return {
        "area_skipped_m2": area_m2,
        "product_avoided_gal": round(area_m2 / 4000, 3),
        "estimated_savings_usd": round(rng.uniform(2, 40), 2),
    }


def write_decision(
    zone_id: str,
    decision: str,
    strategy: str | None = None,
    buffer_rings: int = 0,
    rescout_in_days: int | None = None,
    reason: str = "",
    estimated_savings_usd: float = 0.0,
) -> dict:
    return {
        "zone_id": zone_id,
        "decision": decision,
        "strategy": strategy,
        "buffer_rings": buffer_rings,
        "rescout_in_days": rescout_in_days,
        "reason": reason,
        "estimated_savings_usd": estimated_savings_usd,
    }


def escalate(zone_id: str, reason: str) -> dict:
    return {"zone_id": zone_id, "decision": "escalate", "reason": reason}


TOOL_REGISTRY = {
    "get_zone": get_zone,
    "cell_history": cell_history,
    "sample_images": sample_images,
    "crop_stage": crop_stage,
    "economic_threshold": economic_threshold,
    "species_tolerance": species_tolerance,
    "pest_mobility": pest_mobility,
    "weather": weather,
    "label_rules": label_rules,
    "field_history": field_history,
    "zone_coverage_share": zone_coverage_share,
    "neighboring_zone_diagnoses": neighboring_zone_diagnoses,
    "estimate_savings": estimate_savings,
    "write_decision": write_decision,
    "escalate": escalate,
}

TERMINAL_TOOLS = {"write_decision", "escalate"}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_zone",
            "description": "Get a zone's cells, detections, area and edge context.",
            "parameters": {
                "type": "object",
                "properties": {"zone_id": {"type": "string"}},
                "required": ["zone_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cell_history",
            "description": "Get a cell's last n flights' scores and decisions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cell_id": {"type": "string"},
                    "n": {"type": "integer", "default": 3},
                },
                "required": ["cell_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "sample_images",
            "description": "Get k representative image crops for a zone, for a visual second opinion.",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string"},
                    "k": {"type": "integer", "default": 3},
                },
                "required": ["zone_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "crop_stage",
            "description": "Get a field's growth stage from planting date and degree days.",
            "parameters": {
                "type": "object",
                "properties": {"field_id": {"type": "string"}},
                "required": ["field_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "economic_threshold",
            "description": "Get the extension-guidance action threshold for a crop/problem/stage.",
            "parameters": {
                "type": "object",
                "properties": {
                    "crop": {"type": "string"},
                    "problem": {"type": "string"},
                    "stage": {"type": "string"},
                },
                "required": ["crop", "problem", "stage"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "species_tolerance",
            "description": "Check whether a detected species is zero-tolerance (any confirmed plant mandates spraying).",
            "parameters": {
                "type": "object",
                "properties": {"species": {"type": "string"}},
                "required": ["species"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pest_mobility",
            "description": "Get a problem's mobility class and default buffer-ring count.",
            "parameters": {
                "type": "object",
                "properties": {"problem": {"type": "string"}},
                "required": ["problem"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "weather",
            "description": "Get the rain/wind/temperature forecast for a field over the next N hours.",
            "parameters": {
                "type": "object",
                "properties": {
                    "field_id": {"type": "string"},
                    "hours": {"type": "integer", "default": 48},
                },
                "required": ["field_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "label_rules",
            "description": "Get a product's label constraints: rate limits, PHI, wind/rain limits, buffers.",
            "parameters": {
                "type": "object",
                "properties": {"product": {"type": "string"}},
                "required": ["product"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "field_history",
            "description": "Get a field's prior applications (product, date, zones treated).",
            "parameters": {
                "type": "object",
                "properties": {"field_id": {"type": "string"}},
                "required": ["field_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "zone_coverage_share",
            "description": "Get what share of the field's area the candidate zones cover, for the 60% broadcast-escalation rule.",
            "parameters": {
                "type": "object",
                "properties": {
                    "field_id": {"type": "string"},
                    "candidate_zones": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["field_id", "candidate_zones"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "neighboring_zone_diagnoses",
            "description": "Get adjacent zones' diagnoses and decisions, to avoid duplicate or gapped buffers.",
            "parameters": {
                "type": "object",
                "properties": {"zone_id": {"type": "string"}},
                "required": ["zone_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "estimate_savings",
            "description": "Estimate area skipped, product avoided and dollars saved for a candidate zone plan.",
            "parameters": {
                "type": "object",
                "properties": {"zone_plan": {"type": "object"}},
                "required": ["zone_plan"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_decision",
            "description": (
                "Terminal action. Record the final structured decision for a zone. "
                "Call this exactly once, after gathering evidence, to end the loop."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string"},
                    "decision": {
                        "type": "string",
                        "enum": ["spray", "skip", "re-scout", "escalate"],
                    },
                    "strategy": {
                        "type": "string",
                        "enum": ["spot", "buffered_spot", "edge_strip", "broadcast"],
                    },
                    "buffer_rings": {"type": "integer", "default": 0},
                    "rescout_in_days": {"type": "integer"},
                    "reason": {"type": "string"},
                    "estimated_savings_usd": {"type": "number"},
                },
                "required": ["zone_id", "decision", "reason"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "escalate",
            "description": (
                "Terminal action. Hand a zone to a human agronomist when confidence is too low "
                "to decide safely. Call this instead of write_decision to end the loop."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["zone_id", "reason"],
            },
        },
    },
]
