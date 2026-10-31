from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum
from typing import Optional


class Decision(str, Enum):
    SPRAY = "spray"
    SKIP = "skip"
    RESCOUT = "re-scout"
    ESCALATE = "escalate"


class Strategy(str, Enum):
    SPOT = "spot"
    BUFFERED_SPOT = "buffered_spot"
    EDGE_STRIP = "edge_strip"
    BROADCAST = "broadcast"


@dataclass
class DecisionRecord:
    zone_id: str
    decision: Decision
    strategy: Optional[Strategy]
    buffer_rings: int
    rescout_in_days: Optional[int]
    reason: str
    estimated_savings_usd: float
    overridden: bool = False
    override_reason: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["decision"] = Decision(d["decision"]).value
        if d["strategy"] is not None:
            d["strategy"] = Strategy(d["strategy"]).value
        return d


@dataclass
class EscalationRecord:
    zone_id: str
    reason: str
    decision: str = Decision.ESCALATE.value

    def to_dict(self) -> dict:
        return asdict(self)
