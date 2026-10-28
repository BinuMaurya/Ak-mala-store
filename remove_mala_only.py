from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(r"C:\Users\Kuldeep Singh\Downloads\Ak-mala-store-main\Ak-mala-store-main")
SRC = ROOT / "generated_ganpati_variants" / "ganpati_idol_cutout.png"
OUT = ROOT / "generated_ganpati_variants" / "ganpati_without_mala.png"

img = np.array(Image.open(SRC).convert("RGBA"))
rgb = img[:, :, :3]
alpha = img[:, :, 3]

h, w = rgb.shape[:2]
# Restrict to the actual necklace band only. This avoids catching the robe, torso, or skin.
x1, x2 = int(w * 0.25), int(w * 0.75)
y1, y2 = int(h * 0.28), int(h * 0.58)
roi = np.zeros((h, w), dtype=np.uint8)
roi[y1:y2, x1:x2] = 1

bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

# Select only red/pink mala beads from the central necklace band.
mala_mask = (
    roi
    & (alpha > 0)
    & (((H <= 18) | ((H >= 150) & (H <= 180))) & (S > 30) & (V > 35))
).astype(np.uint8)

kernel = np.ones((3, 3), np.uint8)
mala_mask = cv2.morphologyEx(mala_mask, cv2.MORPH_OPEN, kernel)
mala_mask = cv2.morphologyEx(mala_mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

# Drop anything that is too wide / too tall / too far from the center fixture.
num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mala_mask, connectivity=8)
filtered = np.zeros_like(mala_mask)
for label in range(1, num_labels):
    x, y, ww, hh, area = stats[label]
    if area < 30 or area > 4000:
        continue
    if x < x1 - 20 or x + ww > x2 + 20 or y < y1 - 15 or y + hh > y2 + 15:
        continue
    if ww > (x2 - x1) * 0.9 or hh > (y2 - y1) * 0.85:
        continue
    filtered[labels == label] = 255
mala_mask = filtered.astype(np.uint8)

# Fill only the actual mala beads and keep the rest of the idol untouched.
inpainted = cv2.inpaint(bgr, mala_mask, 3, cv2.INPAINT_TELEA)
out = np.concatenate([inpainted, alpha[:, :, None]], axis=2)
out = out.astype(np.uint8)
Image.fromarray(out, mode='RGBA').save(OUT)
print(f"Saved {OUT}")
print(f"Mala mask pixels: {int(mala_mask.sum())}")
