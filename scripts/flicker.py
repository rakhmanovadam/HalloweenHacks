# Usage: python3 scripts/flicker.py <raw gray frames 192x108> → per-frame mean |Δ| and isolated spikes (pops).
import sys, statistics
W, H = 192, 108
data = open(sys.argv[1], "rb").read()
n = len(data) // (W * H)
frames = [data[i * W * H:(i + 1) * W * H] for i in range(n)]
diffs = [0.0] + [sum(abs(a - b) for a, b in zip(frames[i], frames[i - 1])) / (W * H) for i in range(1, n)]
spikes = []
for i in range(2, n - 2):
    nb = max(diffs[i - 2], diffs[i - 1], diffs[i + 1], diffs[i + 2])
    if diffs[i] > 0.4 and diffs[i] > 2.5 * max(nb, 0.05):
        spikes.append((i, round(diffs[i], 2), round(nb, 2)))
print("frames", n, "median Δ", round(statistics.median(diffs), 3), "max Δ", round(max(diffs), 2), "@", diffs.index(max(diffs)))
print("isolated spikes (frame, Δ, neighbour max):", spikes)
print("largest Δ:", sorted([(i, round(diffs[i], 2)) for i in sorted(range(n), key=lambda i: -diffs[i])[:12]]))
