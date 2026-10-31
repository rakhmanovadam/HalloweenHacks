"""Classify close-up drone or field photos with the trained FieldGrid model.

    python predict.py photo1.jpg photo2.jpg
    python predict.py --dir path/to/images

Prints the predicted class and the probability of each class.
"""

import argparse
from pathlib import Path

import timm
import torch
from PIL import Image
from torchvision.transforms import v2 as T

DEFAULT_WEIGHTS = Path(__file__).parent / "models" / "fieldgrid_closeup_convnext_tiny_fp16.pt"


def load(weights=DEFAULT_WEIGHTS, device="cpu"):
    ck = torch.load(weights, map_location="cpu", weights_only=False)
    model = timm.create_model(ck["model_name"], pretrained=False, num_classes=len(ck["classes"]))
    model.load_state_dict({k: v.float() for k, v in ck["model"].items()})
    model.eval().to(device)
    size = ck["img_size"]
    tf = T.Compose([
        T.Resize(int(size * 1.14), antialias=True), T.CenterCrop(size),
        T.ToImage(), T.ToDtype(torch.float32, scale=True), T.Normalize(ck["mean"], ck["std"]),
    ])
    return model, tf, ck["classes"]


@torch.no_grad()
def predict(paths, weights=DEFAULT_WEIGHTS):
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    model, tf, classes = load(weights, device)
    results = []
    for p in paths:
        x = tf(Image.open(p).convert("RGB")).unsqueeze(0).to(device)
        probs = model(x).softmax(1)[0].cpu().tolist()
        best = max(range(len(classes)), key=lambda i: probs[i])
        results.append({"path": str(p), "pred": classes[best], "conf": probs[best],
                        "probs": dict(zip(classes, probs))})
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("images", nargs="*")
    ap.add_argument("--dir")
    ap.add_argument("--weights", default=DEFAULT_WEIGHTS)
    args = ap.parse_args()
    paths = [Path(p) for p in args.images]
    if args.dir:
        paths += sorted(p for p in Path(args.dir).iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    for r in predict(paths, args.weights):
        probs = "  ".join(f"{k}={v:.2f}" for k, v in r["probs"].items())
        print(f"{r['path']}: {r['pred']} ({r['conf']:.2f})  [{probs}]")
