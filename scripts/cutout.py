#!/usr/bin/env python3
"""Cut the real subject out of an official photo (ISNet, ~/.u2net/isnet-general-use.onnx).

Usage: python3 scripts/cutout.py <src> <name> [--keep-top N] [--crop x0,y0,x1,y1]

Writes images/cutouts/<name>-mask.png (full-size alpha, kept for registration)
and prints the subject bounding box. The photo's pixels are never repainted:
the cut-out is the original RGB with an alpha channel.
"""
import sys, json, os
import numpy as np
import cv2
import onnxruntime as ort

MODEL = os.path.expanduser('~/.u2net/isnet-general-use.onnx')


def isnet_alpha(rgb):
    h, w = rgb.shape[:2]
    sess = ort.InferenceSession(MODEL, providers=['CPUExecutionProvider'])
    x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255.0
    x = (x - 0.5) / 1.0
    x = x.transpose(2, 0, 1)[None]
    out = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_CUBIC).clip(0, 1)


def refine(alpha, keep_top=1):
    # keep the largest connected components, fill small holes, soften 1px edge
    hard = (alpha > 0.5).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
    if n > 1:
        order = np.argsort(-stats[1:, cv2.CC_STAT_AREA])[:keep_top] + 1
        keep = np.isin(lab, order)
    else:
        keep = hard.astype(bool)
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    a = np.where(keep, alpha, 0)
    a = np.clip((a - 0.08) / 0.84, 0, 1)
    return a


def main():
    src, name = sys.argv[1], sys.argv[2]
    keep_top = 1
    crop = None
    args = sys.argv[3:]
    for i, v in enumerate(args):
        if v == '--keep-top': keep_top = int(args[i + 1])
        if v == '--crop': crop = [int(t) for t in args[i + 1].split(',')]
    bgr = cv2.imread(src, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    a = isnet_alpha(rgb)
    a = refine(a, keep_top)
    if crop:
        m = np.zeros_like(a); x0, y0, x1, y1 = crop; m[y0:y1, x0:x1] = 1; a = a * m
    os.makedirs('images/cutouts', exist_ok=True)
    cv2.imwrite(f'images/cutouts/{name}-mask.png', (a * 255).astype(np.uint8))
    ys, xs = np.where(a > 0.05)
    box = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
    print(json.dumps({'name': name, 'src': src, 'size': [rgb.shape[1], rgb.shape[0]], 'bbox': box}))


if __name__ == '__main__':
    main()
