from PIL import Image
import numpy as np, cv2

arr = np.array(Image.open(r'C:\Users\Kuldeep Singh\Downloads\Ak-mala-store-main\Ak-mala-store-main\generated_ganpati_variants\ganpati_idol_cutout.png').convert('RGBA'))
alpha = arr[:,:,3]
h,w = arr.shape[:2]
ys,xs = np.where(alpha>0)
print('full bbox', xs.min(), ys.min(), xs.max(), ys.max())

for y0,y1,name in [(int(h*0.20), int(h*0.35), 'upper'), (int(h*0.30), int(h*0.45), 'neck1'), (int(h*0.35), int(h*0.55), 'neck2'), (int(h*0.40), int(h*0.70), 'mid'), (int(h*0.45), int(h*0.80), 'lower')]:
    x0,x1 = int(w*0.15), int(w*0.85)
    roi = alpha[y0:y1, x0:x1]
    rgb = arr[y0:y1, x0:x1, :3]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    H,S,V = hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]
    masks = {
        'red': ((H<=20)|(H>=160)) & (S>25) & (V>30),
        'orange': ((H>=8)&(H<=35)) & (S>20) & (V>50),
        'gold': ((H>=15)&(H<=55)) & (S>10) & (V>75),
        'pink': ((H>=140)&(H<=180)) & (S>25) & (V>60),
        'white': (S<25) & (V>120),
        'purple': ((H>=100)&(H<=150)) & (S>20) & (V>50),
    }
    print('---', name)
    for k,m in masks.items():
        ys2, xs2 = np.where(m)
        if len(xs2):
            print(k, 'count', int(np.count_nonzero(m)), 'bbox', xs2.min(), ys2.min(), xs2.max(), ys2.max())
        else:
            print(k, 'count', 0)
