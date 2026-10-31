"""FieldGrid classifier inference API + demo sample export.

    modal deploy serve_app.py                       # public HTTPS endpoint for the demo UI
    modal run serve_app.py::export_samples          # write demo images to ../fieldgrid-demo/samples

The endpoint loads the newest /data/runs/<run_id>/best.pt from the "fieldgrid-data"
volume, so a finished training run shows up in the demo without a redeploy.

    GET  /health    -> {"ready": bool, "run_id": str | null, "classes": [...]}
    POST /classify  -> body {"image": "<base64 jpeg/png, data: URL ok>"}
                       returns {"run_id", "classes", "probs": {cls: p}, "top", "confidence", "ms"}
"""

from pathlib import Path

import modal

app = modal.App("fieldgrid-serve")
vol = modal.Volume.from_name("fieldgrid-data", create_if_missing=True)

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch==2.5.1", "torchvision==0.20.1", "timm==1.0.12", "pillow==11.0.0",
    "fastapi[standard]==0.115.6", "pandas==2.2.3",
)

MAX_BYTES = 8 * 1024 * 1024


@app.cls(image=image, volumes={"/data": vol}, cpu=2, memory=4096, scaledown_window=600, timeout=120)
@modal.concurrent(max_inputs=8)
class Classifier:
    @modal.enter()
    def setup(self):
        self.run_id = None
        self.model = None

    def _latest_run(self):
        vol.reload()
        runs = sorted(p for p in Path("/data/runs").glob("*/best.pt")) if Path("/data/runs").exists() else []
        return runs[-1] if runs else None

    def _load(self):
        import timm
        import torch
        from torchvision.transforms import v2 as T

        ckpt_path = self._latest_run()
        if ckpt_path is None:
            return False
        run_id = ckpt_path.parent.name
        if run_id == self.run_id:
            return True
        ck = torch.load(ckpt_path, map_location="cpu", weights_only=False)
        model = timm.create_model(ck["model_name"], pretrained=False, num_classes=len(ck["classes"]))
        model.load_state_dict(ck["model"])
        model.eval()
        size = ck["img_size"]
        self.tf = T.Compose([
            T.Resize(int(size * 1.14), antialias=True), T.CenterCrop(size),
            T.ToImage(), T.ToDtype(torch.float32, scale=True), T.Normalize(ck["mean"], ck["std"]),
        ])
        self.model, self.classes, self.run_id = model, ck["classes"], run_id
        return True

    @modal.asgi_app()
    def web(self):
        import base64
        import io
        import time

        import torch
        from fastapi import FastAPI, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        from PIL import Image

        api = FastAPI(title="FieldGrid classifier")
        api.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])

        @api.get("/health")
        def health():
            ready = self._load()
            return {"ready": ready, "run_id": self.run_id, "classes": getattr(self, "classes", None)}

        @api.post("/classify")
        def classify(body: dict):
            if not self._load():
                raise HTTPException(503, "No trained checkpoint yet. Training is still running.")
            data = str(body.get("image", ""))
            if "," in data[:100]:
                data = data.split(",", 1)[1]
            try:
                raw = base64.b64decode(data, validate=False)
                if len(raw) > MAX_BYTES:
                    raise HTTPException(413, "Image is larger than 8 MB.")
                img = Image.open(io.BytesIO(raw)).convert("RGB")
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(400, "Could not read that image. Send a JPEG or PNG.")
            t0 = time.time()
            with torch.no_grad():
                p = self.model(self.tf(img).unsqueeze(0)).softmax(1)[0].tolist()
            probs = dict(zip(self.classes, p))
            top = max(probs, key=probs.get)
            return {"run_id": self.run_id, "classes": self.classes, "probs": probs, "top": top,
                    "confidence": probs[top], "ms": round((time.time() - t0) * 1000)}

        return api


@app.function(image=image, volumes={"/data": vol}, cpu=2, memory=4096, timeout=600)
def _pick_samples(per_class: int = 6, side: int = 384) -> list:
    """Pick held-out test images per class, spread across source datasets."""
    import glob
    import io

    import pandas as pd
    from PIL import Image

    man = pd.concat([pd.read_csv(p) for p in glob.glob("/data/manifests/*.csv")], ignore_index=True)
    man = man[man.split == "test"]
    out = []
    for cls, sub in man.groupby("cls"):
        picks = sub.groupby("source", group_keys=False).apply(lambda g: g.sample(min(len(g), 2), random_state=3))
        picks = picks.sample(min(len(picks), per_class), random_state=3)
        for k, row in enumerate(picks.itertuples()):
            img = Image.open(row.path).convert("RGB")
            img.thumbnail((side, side))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=82)
            out.append({"cls": cls, "file": f"{cls}_{k}.jpg", "source": row.source, "domain": row.domain,
                        "orig_label": str(row.orig_label), "license": row.license, "bytes": buf.getvalue()})
    return out


@app.local_entrypoint()
def export_samples(out_dir: str = "../fieldgrid-demo/samples", per_class: int = 6):
    import json

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    meta = []
    for s in _pick_samples.remote(per_class=per_class):
        (out / s["file"]).write_bytes(s.pop("bytes"))
        meta.append(s)
    (out / "index.json").write_text(json.dumps(meta, indent=2))
    print(f"wrote {len(meta)} images to {out}")
