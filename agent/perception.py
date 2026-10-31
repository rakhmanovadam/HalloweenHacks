"""Bridges the agent's tool layer to the real close-up classifier in ml/.

get_zone's `detections` field is still a stub (there's no real zone/cell
database yet) -- but once inspection-pass photos exist on disk, this is what
should populate it instead of the random classification in tools.py.
"""

from __future__ import annotations

import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent / "ml"


def classify_closeup(image_paths: list[str]) -> list[dict]:
    """Run the trained ConvNeXt-Tiny classifier on close-up photo tiles.

    Returns one {"path", "class", "confidence", "probs"} dict per image,
    shaped to match tools.get_zone's "detections" field.
    """
    if str(ML_DIR) not in sys.path:
        sys.path.insert(0, str(ML_DIR))
    from predict import predict  # requires ml/requirements.txt installed

    results = predict([Path(p) for p in image_paths])
    return [
        {"path": r["path"], "class": r["pred"], "confidence": r["conf"], "probs": r["probs"]}
        for r in results
    ]
