# processor.py
# 画像処理ロジック（Pillow）©️2025 KisaragiIchigo
import os
from typing import Callable, List, Tuple
from PIL import Image

# 対応拡張子（小文字で比較）
SUPPORTED_EXTS = (".png",".jpg",".jpeg",".bmp",".gif",".tiff",".webp")

def _has_alpha(img: Image.Image) -> bool:
    """#説明: アルファチャネルを持つかどうか判定"""
    if "A" in img.getbands():  # RGBA, LAなど
        return True
    return "transparency" in img.info  # パレット透過

def _rgb_for_detection(img: Image.Image, color_type: str) -> Image.Image:
    """
    #説明: 検出用にRGB画像を作る。
    透明がある場合は '白背景検出' なら白、'黒背景検出' なら黒で下地合成してからRGB化。
    """
    if _has_alpha(img):
        bg = (255,255,255,255) if color_type=="white" else (0,0,0,255)
        base = Image.new("RGBA", img.size, bg)
        tmp = img.convert("RGBA")
        base.paste(tmp, (0,0), tmp)
        return base.convert("RGB")
    else:
        return img.convert("RGB")

def detect_whitespace(img_rgb: Image.Image, color_type: str, direction: str, thr: int = 70) -> Tuple[int,int,int,int]:
    """
    端から走査して「背景じゃない色」が初めて出た位置で境界確定。
    color_type: 'white' or 'black'
    direction: 'horizontal' | 'vertical' | 'both'
    ※ img_rgb は RGB 想定（_rgb_for_detectionで作る）
    """
    w, h = img_rgb.size
    px = img_rgb.load()

    def is_bg(rgb):
        r,g,b = rgb
        if color_type == "black":
            return r<=thr and g<=thr and b<=thr
        else:
            return r>=255-thr and g>=255-thr and b>=255-thr

    left, right, top, bottom = 0, w, 0, h
    if direction in ("horizontal", "both"):
        for x in range(w):
            if any(not is_bg(px[x,y]) for y in range(h)):
                left = x; break
        for x in range(w-1, -1, -1):
            if any(not is_bg(px[x,y]) for y in range(h)):
                right = x+1; break
    if direction in ("vertical", "both"):
        for y in range(h):
            if any(not is_bg(px[x,y]) for x in range(w)):
                top = y; break
        for y in range(h-1, -1, -1):
            if any(not is_bg(px[x,y]) for x in range(w)):
                bottom = y+1; break

    left   = max(0, min(left, w-1))
    right  = max(left+1, min(right, w))
    top    = max(0, min(top, h-1))
    bottom = max(top+1, min(bottom, h))
    return left, right, top, bottom

def trim_whitespace(image_path: str, output_path: str, keep_margin_percent: int, color_type: str, direction: str):
    """
    #説明:
    - 検出は RGB（透明は白or黒合成）で実施
    - 実際の切り抜きは元画像モードのまま
    - 余白追加あり: 透過画像は透明キャンバス / 非透過は白キャンバス
    - 保存は拡張子に合わせて自動（JPEG等はRGBに変換）
    """
    orig = Image.open(image_path)
    w, h = orig.size

    det = _rgb_for_detection(orig, color_type)
    l, r, t, b = detect_whitespace(det, color_type, direction, thr=70)

    cropped = orig.crop((l, t, r, b))

    if keep_margin_percent > 0:
        mw = int(w * keep_margin_percent / 100.0)
        mh = int(h * keep_margin_percent / 100.0)
        nw, nh = (r-l) + 2*mw, (b-t) + 2*mh
        if _has_alpha(cropped):
            canvas = Image.new("RGBA", (nw, nh), (0,0,0,0))  # 透過キャンバス
        else:
            canvas = Image.new("RGB", (nw, nh), (255, 255, 255))  # 白キャンバス
        canvas.paste(cropped, (mw, mh) if cropped.mode!="RGBA" else (mw, mh), cropped if cropped.mode=="RGBA" else None)
        cropped = canvas

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    ext = os.path.splitext(output_path)[1].lower()
    if ext in (".jpg", ".jpeg", ".bmp"):
        # α非対応形式はRGBへ
        if _has_alpha(cropped) or cropped.mode not in ("RGB","L"):
            cropped = cropped.convert("RGB")
        cropped.save(output_path)
    else:
        # PNG/WebP/GIF/TIFF 等は元のモードでOK
        cropped.save(output_path)

def process_targets(
    inputs: List[str],
    color_type: str,
    direction: str,
    keep_margin_percent: int,
    progress_cb: Callable[[int,int], None] | None = None,
    is_cancelled: Callable[[], bool] | None = None
) -> List[str]:
    targets: List[str] = []

    def collect_dir(d: str):
        for root, _, files in os.walk(d):
            for f in files:
                if f.lower().endswith(SUPPORTED_EXTS):
                    targets.append(os.path.join(root, f))

    for p in inputs:
        if os.path.isdir(p): collect_dir(p)
        elif os.path.isfile(p) and p.lower().endswith(SUPPORTED_EXTS):
            targets.append(p)

    total = len(targets)
    if progress_cb: progress_cb(0, total)

    errors: List[str] = []
    for i, src in enumerate(targets, 1):
        if is_cancelled and is_cancelled():
            break
        try:
            out = os.path.join(os.path.dirname(src), "Remake", os.path.basename(src))
            trim_whitespace(src, out, keep_margin_percent, color_type, direction)
        except Exception as e:
            errors.append(f"{src}: {e}")
        if progress_cb: progress_cb(i, total)

    return errors
