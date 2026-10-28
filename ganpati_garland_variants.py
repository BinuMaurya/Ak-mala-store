from __future__ import annotations

import os
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import remove

SRC = Path(r"C:\Users\Kuldeep Singh\Downloads\Ak-mala-store-main\Ak-mala-store-main\public\ganpati_darshan.jpg")
OUT = Path(r"C:\Users\Kuldeep Singh\Downloads\Ak-mala-store-main\Ak-mala-store-main\generated_ganpati_variants")
OUT.mkdir(exist_ok=True, parents=True)

colors = {
    "red": (220, 20, 20),
    "orange": (245, 130, 32),
    "yellow": (255, 220, 0),
    "green": (22, 150, 72),
    "light green": (120, 210, 110),
    "blue": (18, 74, 220),
    "sky blue": (74, 179, 255),
    "purple": (130, 58, 220),
    "pink": (235, 92, 188),
    "magenta": (210, 36, 170),
    "white": (245, 245, 245),
    "golden yellow": (214, 174, 42),
}


def ensure_rgb(img: Image.Image) -> Image.Image:
    if img.mode != "RGBA":
        return img.convert("RGBA")
    return img


def save_debug(img: Image.Image, name: str) -> None:
    img.save(OUT / f"{name}.png")


# Step 1: remove the background to keep only the idol and its garland.
# Reuse the existing cutout when it is already present so we do not trigger another expensive rembg download.
cutout_path = OUT / "ganpati_idol_cutout.png"
if cutout_path.exists():
    cutout = ensure_rgb(Image.open(cutout_path))
else:
    base = ensure_rgb(Image.open(SRC))
    cutout = ensure_rgb(remove(base))
    cutout.save(cutout_path)

# Step 2: build a neck-region garland mask by using a constrained upper-torso region and selecting only garland-like colors.
arr = np.array(cutout)
alpha = arr[:, :, 3]
ys, xs = np.where(alpha > 0)
minx, maxx = int(xs.min()), int(xs.max())
miny, maxy = int(ys.min()), int(ys.max())

h, w = arr.shape[:2]
# Restrict aggressively to the upper-neck band; the garland is a necklace/flower accent around the throat and above the robe.
neck_x1 = int(w * 0.18)
neck_x2 = int(w * 0.82)
neck_y1 = int(h * 0.22)
neck_y2 = int(h * 0.46)

mask = alpha > 0
roi = np.zeros_like(mask, dtype=bool)
roi[neck_y1:neck_y2, neck_x1:neck_x2] = True

rgb = arr[:, :, :3].astype(np.float32)
img_hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
hsv_h = img_hsv[:, :, 0]
hsv_s = img_hsv[:, :, 1]
hsv_v = img_hsv[:, :, 2]

# Only keep actual garland tones near the neck: warm reds, pinks, golds, and whites.
garland_mask = (
    mask
    & roi
    & (hsv_v > 90)
    & (
        (((hsv_h <= 20) | ((hsv_h >= 150) & (hsv_h <= 180))) & (hsv_s > 60) & (rgb[:, :, 2] > 60))
        | (((hsv_h >= 15) & (hsv_h <= 55)) & (hsv_s > 20) & (hsv_v > 120) & (rgb[:, :, 1] > 80) & (rgb[:, :, 2] > 70))
        | ((hsv_s < 35) & (hsv_v > 150) & (rgb.mean(axis=2) > 170))
    )
)

# Cleanup the mask while keeping the detailed necklace and floral elements.
kernel = np.ones((3, 3), dtype=np.uint8)
garland_mask = cv2.morphologyEx(garland_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel).astype(bool)
garland_mask = cv2.morphologyEx(garland_mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel).astype(bool)

# Discard broad robe-like blobs and keep only compact necklace / bead components.
num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(garland_mask.astype(np.uint8), connectivity=8)
filtered = np.zeros_like(garland_mask, dtype=bool)
for label in range(1, num_labels):
    x, y, w2, h2, area = stats[label]
    if area < 15 or area > 1500:
        continue
    if x < neck_x1 or x + w2 > neck_x2:
        continue
    if y < neck_y1 or y + h2 > neck_y2:
        continue
    filtered[labels == label] = True
garland_mask = filtered

def replace_hue(rgb_px: np.ndarray, target_rgb: tuple[int, int, int]) -> np.ndarray:
    # Preserve value and saturation structure while swapping the hue toward the desired garland color.
    hsv_px = cv2.cvtColor(np.uint8([[[*rgb_px]]]), cv2.COLOR_RGB2HSV)[0, 0]
    h, s, v = hsv_px
    t_hsv = cv2.cvtColor(np.uint8([[[*target_rgb]]]), cv2.COLOR_RGB2HSV)[0, 0]

    # For near-white pixels, keep a soft tint toward the target and retain luminance.
    if s < 20:
        new_val = min(255, int(v * 0.9))
        new_hsv = np.array([t_hsv[0], min(255, int(t_hsv[1] * 0.75)), new_val], dtype=np.uint8)
        rgb_out = cv2.cvtColor(new_hsv.reshape(1, 1, 3), cv2.COLOR_HSV2RGB)[0, 0]
        return rgb_out.astype(np.uint8)

    new_hsv = np.array([t_hsv[0], max(30, min(255, int(s * 1.1))), max(30, min(255, int(v)))], dtype=np.uint8)
    rgb_out = cv2.cvtColor(new_hsv.reshape(1, 1, 3), cv2.COLOR_HSV2RGB)[0, 0]
    return rgb_out.astype(np.uint8)

# Save a preview of the isolated garland mask to debug.
mask_img = np.zeros(arr.shape[:2] + (3,), dtype=np.uint8)
mask_img[garland_mask] = [255, 255, 255]
Image.fromarray(mask_img).save(OUT / "garland_mask_debug.png")

for color_name, target_rgb in colors.items():
    result = arr.copy()

    # Only recolor pixels in the garland mask and keep the rest of the idol untouched.
    target_array = np.array(target_rgb, dtype=np.uint8)
    for y in range(arr.shape[0]):
        for x in range(arr.shape[1]):
            if garland_mask[y, x]:
                result[y, x, :3] = replace_hue(arr[y, x, :3], target_rgb)

    final = Image.fromarray(result, mode="RGBA")
    filename = f"ganpati_bappa_garland_{color_name.replace(' ', '_')}.png"
    final.save(OUT / filename, compress_level=0)
    print(f"saved: {filename}")

print(f"Generated all variants in: {OUT}")
