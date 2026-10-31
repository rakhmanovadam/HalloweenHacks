"""FieldGrid close-up classifier: data prep + training on Modal.

    modal run modal_app.py                 # prep all datasets, then train
    modal run modal_app.py --step prep     # only build the dataset
    modal run modal_app.py --step train --epochs 12

Images and results live in the Modal volume "fieldgrid-data":
    /data/images/<class>/<source>_<n>.jpg
    /data/manifests/<source>.csv
    /data/runs/<run_id>/{best.pt, metrics.json, report.txt}
"""

from pathlib import Path

import modal

from label_map import CLASSES, SOURCES

app = modal.App("fieldgrid-ml")
vol = modal.Volume.from_name("fieldgrid-data", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.5.1", "torchvision==0.20.1", "timm==1.0.12", "datasets==3.2.0",
        "pillow==11.0.0", "pandas==2.2.3", "scikit-learn==1.5.2", "numpy<2.2",
        "huggingface_hub==0.27.1",
    )
    .add_local_python_source("label_map")
)

SHORT_SIDE = 512  # stored resolution; training crops down from this


@app.function(image=image, volumes={"/data": vol}, cpu=4, memory=8192, timeout=3 * 3600)
def prepare(source_id: str) -> str:
    """Stream one Hugging Face dataset, relabel, resize, and save into the volume."""
    import csv
    import hashlib

    from datasets import load_dataset, load_dataset_builder

    from label_map import target_class, slug

    cfg = SOURCES[source_id]
    caps = cfg["caps"]
    name = slug(source_id)

    names = load_dataset_builder(source_id).info.features["label"].names
    ds = load_dataset(source_id, split="train", streaming=True).shuffle(seed=0, buffer_size=2000)

    counts = {c: 0 for c in CLASSES}
    rows = []
    for i, ex in enumerate(ds):
        cls = target_class(source_id, names[ex["label"]])
        if cls is None:
            continue
        cap = caps.get(cls)
        if cap is not None and counts[cls] >= cap:
            # stop early once every capped class present in this source is full
            if all(counts[c] >= caps[c] for c in caps) and not any(
                k not in caps for k in set(_targets(source_id, names))
            ):
                break
            continue

        img = ex["image"].convert("RGB")
        w, h = img.size
        scale = SHORT_SIDE / min(w, h)
        if scale < 1:
            img = img.resize((round(w * scale), round(h * scale)))

        out_dir = Path("/data/images") / cls
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / f"{name}_{i}.jpg"
        img.save(path, quality=90)

        # deterministic 80/10/10 split
        bucket = int(hashlib.md5(f"{name}_{i}".encode()).hexdigest(), 16) % 10
        split = "test" if bucket == 0 else "val" if bucket == 1 else "train"
        rows.append({"path": str(path), "cls": cls, "source": name, "orig_label": names[ex["label"]],
                     "domain": cfg["domain"], "license": cfg["license"], "split": split})
        counts[cls] += 1

    Path("/data/manifests").mkdir(parents=True, exist_ok=True)
    with open(f"/data/manifests/{name}.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    vol.commit()
    kept = {k: v for k, v in counts.items() if v}
    return f"{name}: {len(rows)} images {kept}"


def _targets(source_id, names):
    from label_map import target_class
    return [t for t in (target_class(source_id, n) for n in names) if t]


@app.function(image=image, volumes={"/data": vol}, gpu="A10G", cpu=8, memory=32768, timeout=6 * 3600)
def train(epochs: int = 6, model_name: str = "convnext_tiny.fb_in22k_ft_in1k",
          img_size: int = 224, batch_size: int = 64, lr: float = 3e-4,
          max_per_class: int = 2500) -> str:
    import glob
    import json
    import shutil
    import time

    import numpy as np
    import pandas as pd
    import timm
    import torch
    from PIL import Image
    from sklearn.metrics import classification_report, confusion_matrix, f1_score
    from torch.utils.data import DataLoader, Dataset
    from torchvision.transforms import v2 as T

    vol.reload()
    man = pd.concat([pd.read_csv(p) for p in glob.glob("/data/manifests/*.csv")], ignore_index=True)

    # cap images per class (val/test get a fifth of the cap) to keep runs short
    def cap(df, n):
        return df.groupby("cls", group_keys=False).apply(lambda g: g.sample(min(len(g), n), random_state=0))
    man = pd.concat([cap(man[man.split == "train"], max_per_class),
                     cap(man[man.split != "train"], max_per_class // 5)], ignore_index=True)

    # copy the selected images to local disk; much faster than reading the volume every epoch
    man["local"] = man["path"].str.replace("/data/images", "/tmp/images", regex=False)
    for c in CLASSES:
        Path(f"/tmp/images/{c}").mkdir(parents=True, exist_ok=True)
    # volume reads are latency-bound, so copy many files at once
    from concurrent.futures import ThreadPoolExecutor
    t_copy = time.time()
    with ThreadPoolExecutor(max_workers=64) as pool:
        list(pool.map(shutil.copyfile, man["path"], man["local"]))
    print(f"copied {len(man)} images in {time.time() - t_copy:.0f}s", flush=True)
    man["y"] = man["cls"].map({c: i for i, c in enumerate(CLASSES)})

    model = timm.create_model(model_name, pretrained=True, num_classes=len(CLASSES))
    dcfg = timm.data.resolve_data_config({}, model=model)
    mean, std = dcfg["mean"], dcfg["std"]

    train_tf = T.Compose([
        T.RandomResizedCrop(img_size, scale=(0.3, 1.0), antialias=True),
        T.RandomHorizontalFlip(), T.RandomVerticalFlip(),
        T.RandomApply([T.ColorJitter(0.3, 0.3, 0.3, 0.05)], p=0.8),
        T.RandomApply([T.Resize(img_size // 2, antialias=True), T.Resize(img_size, antialias=True)], p=0.3),
        T.RandomApply([T.GaussianBlur(5, sigma=(0.1, 2.0))], p=0.3),  # drone motion/altitude blur
        T.ToImage(), T.ToDtype(torch.float32, scale=True), T.Normalize(mean, std),
    ])
    eval_tf = T.Compose([
        T.Resize(int(img_size * 1.14), antialias=True), T.CenterCrop(img_size),
        T.ToImage(), T.ToDtype(torch.float32, scale=True), T.Normalize(mean, std),
    ])

    class Tiles(Dataset):
        def __init__(self, df, tf):
            self.paths, self.ys, self.tf = df["local"].tolist(), df["y"].tolist(), tf

        def __len__(self):
            return len(self.paths)

        def __getitem__(self, i):
            return self.tf(Image.open(self.paths[i]).convert("RGB")), self.ys[i]

    tr, va, te = (man[man.split == s].reset_index(drop=True) for s in ("train", "val", "test"))
    train_dl = DataLoader(Tiles(tr, train_tf), batch_size=batch_size, shuffle=True,
                          num_workers=8, pin_memory=True, drop_last=True)
    val_dl = DataLoader(Tiles(va, eval_tf), batch_size=128, num_workers=8)
    test_dl = DataLoader(Tiles(te, eval_tf), batch_size=128, num_workers=8)

    # inverse-sqrt class weights: rare classes count more without overwhelming common ones
    freq = np.bincount(tr["y"], minlength=len(CLASSES)).astype(float)
    weights = torch.tensor((freq.sum() / np.maximum(freq, 1)) ** 0.5, dtype=torch.float32)
    weights = weights / weights.mean()

    dev = "cuda"
    model = model.to(dev)
    loss_fn = torch.nn.CrossEntropyLoss(weight=weights.to(dev), label_smoothing=0.1)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.05)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=lr, total_steps=epochs * len(train_dl), pct_start=0.1)

    def predict(dl):
        model.eval()
        ps = []
        with torch.no_grad(), torch.autocast("cuda", dtype=torch.bfloat16):
            for x, _ in dl:
                ps.append(model(x.to(dev, non_blocking=True)).float().softmax(1).cpu())
        return torch.cat(ps).numpy()

    run_id = time.strftime("%Y%m%d-%H%M%S")
    run_dir = Path(f"/data/runs/{run_id}")
    run_dir.mkdir(parents=True, exist_ok=True)
    best_f1, history = -1.0, []

    for epoch in range(epochs):
        model.train()
        t0, total = time.time(), 0.0
        for x, y in train_dl:
            x, y = x.to(dev, non_blocking=True), y.to(dev, non_blocking=True)
            with torch.autocast("cuda", dtype=torch.bfloat16):
                loss = loss_fn(model(x), y)
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
            sched.step()
            total += loss.item()
        vp = predict(val_dl)
        vf1 = f1_score(va["y"], vp.argmax(1), average="macro")
        history.append({"epoch": epoch, "loss": total / len(train_dl), "val_macro_f1": vf1})
        print(f"epoch {epoch}: loss {total / len(train_dl):.4f} val macro-F1 {vf1:.4f} ({time.time() - t0:.0f}s)", flush=True)
        if vf1 > best_f1:
            best_f1 = vf1
            torch.save({"model": model.state_dict(), "model_name": model_name, "classes": CLASSES,
                        "img_size": img_size, "mean": mean, "std": std}, run_dir / "best.pt")

    # final test with the best checkpoint
    model.load_state_dict(torch.load(run_dir / "best.pt", weights_only=False)["model"])
    tp = predict(test_dl)
    te["pred"] = [CLASSES[i] for i in tp.argmax(1)]
    labels = list(range(len(CLASSES)))
    report = classification_report(te["y"], tp.argmax(1), labels=labels, target_names=CLASSES, digits=3, zero_division=0)
    cm = confusion_matrix(te["y"], tp.argmax(1), labels=labels)
    by_domain = te.assign(ok=te["pred"] == te["cls"]).groupby("domain")["ok"].agg(["mean", "size"])
    by_source = te.assign(ok=te["pred"] == te["cls"]).groupby("source")["ok"].agg(["mean", "size"])

    counts = man.groupby(["split", "cls"]).size().unstack(fill_value=0)
    text = "\n".join([
        f"run {run_id}  model {model_name}  img {img_size}  epochs {epochs}",
        f"best val macro-F1: {best_f1:.4f}",
        "", "images per split and class:", counts.to_string(),
        "", "TEST classification report:", report,
        "confusion matrix (rows = true, cols = predicted):",
        pd.DataFrame(cm, index=CLASSES, columns=CLASSES).to_string(),
        "", "test accuracy by capture domain:", by_domain.round(3).to_string(),
        "", "test accuracy by source dataset:", by_source.round(3).to_string(),
    ])
    (run_dir / "report.txt").write_text(text)
    (run_dir / "metrics.json").write_text(json.dumps({"history": history, "best_val_macro_f1": best_f1,
                                                      "confusion": cm.tolist(), "classes": CLASSES}, indent=2))
    te.drop(columns=["local"]).to_csv(run_dir / "test_predictions.csv", index=False)
    vol.commit()
    return text


@app.function(image=image, volumes={"/data": vol}, cpu=2, memory=4096, timeout=600)
def samples(per_class: int = 6, tile: int = 220) -> bytes:
    """Contact sheet: one row per class, random images labeled with their source dataset."""
    import glob
    import io

    import pandas as pd
    from PIL import Image, ImageDraw

    vol.reload()
    man = pd.concat([pd.read_csv(p) for p in glob.glob("/data/manifests/*.csv")], ignore_index=True)
    label_w, pad = 150, 4
    sheet = Image.new("RGB", (label_w + per_class * (tile + pad), len(CLASSES) * (tile + 34)), "white")
    draw = ImageDraw.Draw(sheet)
    for r, cls in enumerate(CLASSES):
        y0 = r * (tile + 34)
        sub = man[man.cls == cls]
        draw.text((8, y0 + tile // 2), f"{cls}\n({len(sub)} images)", fill="black")
        # spread picks across sources so every dataset shows up
        picks = sub.groupby("source", group_keys=False).apply(lambda g: g.sample(min(len(g), 2), random_state=1))
        picks = picks.sample(min(len(picks), per_class), random_state=1)
        for c, row in enumerate(picks.itertuples()):
            img = Image.open(row.path).convert("RGB")
            img.thumbnail((tile, tile))
            x = label_w + c * (tile + pad)
            sheet.paste(img, (x, y0))
            draw.text((x, y0 + tile + 4), f"{row.source[:30]}\n{row.domain}: {str(row.orig_label)[:24]}", fill="black")
    buf = io.BytesIO()
    sheet.save(buf, format="PNG")
    return buf.getvalue()


@app.local_entrypoint()
def main(step: str = "all", epochs: int = 6):
    if step == "samples":
        Path("results").mkdir(exist_ok=True)
        Path("results/samples.png").write_bytes(samples.remote())
        print("wrote results/samples.png")
        return
    if step in ("prep", "all"):
        for line in prepare.map(list(SOURCES), return_exceptions=True):
            print(line)
    if step in ("train", "all"):
        text = train.remote(epochs=epochs)
        print(text)
        Path("results").mkdir(exist_ok=True)
        Path("results/report.txt").write_text(text)
