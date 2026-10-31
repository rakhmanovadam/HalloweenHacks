# Agrivision demo site

Static product demo. Live: https://agrivision-tan.vercel.app

- `index.html` — product page: problem stats, infrared survey, live classifier playground, agent spray map, why Agrivision.
- `demo.html` — 7-step click-through presenter demo (arrow keys, auto-play, presenter script).
- `samples/` — held-out test images per class used by the classifier playground (Project AgML datasets, CC BY / CC BY-NC).
- `api/serve_app.py` — Modal inference API the playground calls. It loads the newest `/data/runs/*/best.pt` from the `fieldgrid-data` volume.

Run locally: `python3 -m http.server 8000` inside `demo/`, then open http://localhost:8000.
Deploy: `vercel deploy --prod` inside `demo/`. API: `modal deploy api/serve_app.py`.
