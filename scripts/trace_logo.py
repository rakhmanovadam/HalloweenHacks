# Traces the AgriVision logo PNG (via sips → BMP) into rounded-line SVG geometry.
import struct, math, collections, json, sys
raw = open(sys.argv[1], "rb").read()
off = struct.unpack_from("<I", raw, 10)[0]
W, H = struct.unpack_from("<ii", raw, 18)
bpp = struct.unpack_from("<H", raw, 28)[0]
topdown = H < 0; H = abs(H)
stride = ((W * bpp + 31) // 32) * 4
def px(x, y):
    row = y if topdown else H - 1 - y
    i = off + row * stride + x * (bpp // 8)
    b, g, r = raw[i], raw[i + 1], raw[i + 2]
    a = raw[i + 3] if bpp == 32 else 255
    return r, g, b, a
print("bmp", W, H, bpp, "corner px", px(5, 5), "centre", px(W // 2, H // 2), file=sys.stderr)
S = 2  # sample step
cls = {}
for y in range(0, H, S):
    for x in range(0, W, S):
        r, g, b, a = px(x, y)
        if a < 128 or (r + g + b) < 40: continue
        cls[(x, y)] = "lime" if g > 150 else "bar"
seen = set(); comps = []
for p, k in cls.items():
    if p in seen: continue
    q = [p]; seen.add(p); pts = []
    while q:
        c = q.pop(); pts.append(c)
        for dx, dy in ((S, 0), (-S, 0), (0, S), (0, -S)):
            n = (c[0] + dx, c[1] + dy)
            if n in cls and n not in seen and cls[n] == k: seen.add(n); q.append(n)
    if len(pts) > 200: comps.append((k, pts))
out = []
for k, pts in comps:
    n = len(pts); cx = sum(p[0] for p in pts) / n; cy = sum(p[1] for p in pts) / n
    sxx = sum((p[0] - cx) ** 2 for p in pts) / n; syy = sum((p[1] - cy) ** 2 for p in pts) / n
    sxy = sum((p[0] - cx) * (p[1] - cy) for p in pts) / n
    ang = 0.5 * math.atan2(2 * sxy, sxx - syy)
    ux, uy = math.cos(ang), math.sin(ang)
    t = [(p[0] - cx) * ux + (p[1] - cy) * uy for p in pts]
    s = [-(p[0] - cx) * uy + (p[1] - cy) * ux for p in pts]
    cols = collections.Counter(px(int(p[0]), int(p[1]))[:3] for p in pts[:: max(1, n // 400)])
    out.append({"kind": k, "cx": round(cx, 1), "cy": round(cy, 1), "angle": round(math.degrees(ang), 2),
                "tmin": round(min(t), 1), "tmax": round(max(t), 1), "smin": round(min(s), 1), "smax": round(max(s), 1),
                "area": n * S * S, "color": "#%02X%02X%02X" % cols.most_common(1)[0][0]})
print(json.dumps(sorted(out, key=lambda o: (o["kind"], o["cy"] - o["cx"])), indent=1))
