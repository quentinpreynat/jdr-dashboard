import argparse
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


DEFAULT_INPUT = r"C:\Users\quent\Documents\workspace\jdr-dashboard\src\assets\grimoire.png"
DEFAULT_OUTPUT = r"C:\Users\quent\Documents\workspace\jdr-dashboard\src\assets\grimoire_candles.gif"

# Coordinates tuned for a 1536x1024 image.
# Adjust if you change the image or want tighter/looser flicker coverage.
CANDLES = [
    {
        "name": "left",
        "bbox": (150, 300, 270, 430),
        "flame_center": (210, 350),
        "glow_radius": 70,
        "glow_color": (255, 145, 70),
        "core_inner_radius": 14,
        "core_inner_color": (255, 190, 95),
        "core_outer_radius": 30,
        "core_outer_color": (255, 155, 70),
    },
    {
        "name": "right",
        "bbox": (1260, 300, 1435, 470),
        "flame_center": (1350, 350),
        "glow_radius": 70,
        "glow_color": (255, 145, 70),
        "core_inner_radius": 14,
        "core_inner_color": (255, 190, 95),
        "core_outer_radius": 30,
        "core_outer_color": (255, 155, 70),
    },
]


def build_soft_mask(size, bbox, blur_radius=10):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle(bbox, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(blur_radius))


def build_radial_mask(size, center, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    cx, cy = center
    for r in range(radius, 0, -3):
        alpha = int(255 * (r / radius) ** 1.7)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=alpha)
    return mask.filter(ImageFilter.GaussianBlur(8))


def apply_flicker(
    frame,
    candle,
    strength,
    region_mask,
    glow_mask,
    core_outer_mask,
    core_inner_mask,
):
    x1, y1, x2, y2 = candle["bbox"]
    region = frame.crop((x1, y1, x2, y2))

    # Warm, subtle brightness/color boost for the candle area.
    region = ImageEnhance.Brightness(region).enhance(1.0 + 0.14 * strength)
    region = ImageEnhance.Color(region).enhance(1.0 + 0.10 * strength)

    adjusted_full = frame.copy()
    adjusted_full.paste(region, (x1, y1, x2, y2))

    # Composite softened region back.
    frame = Image.composite(adjusted_full, frame, region_mask)

    # Add a glow layer.
    glow = Image.new("RGBA", frame.size, candle["glow_color"] + (0,))
    alpha = glow_mask.point(lambda v: int(v * (0.22 * strength)))
    glow.putalpha(alpha)
    frame = Image.alpha_composite(frame.convert("RGBA"), glow).convert("RGB")

    # Two-layer core gradient: warm outer + brighter inner.
    core_outer = Image.new("RGBA", frame.size, candle["core_outer_color"] + (0,))
    core_outer_alpha = core_outer_mask.point(lambda v: int(v * (0.52 * strength)))
    core_outer.putalpha(core_outer_alpha)
    frame = Image.alpha_composite(frame.convert("RGBA"), core_outer).convert("RGB")

    core_inner = Image.new("RGBA", frame.size, candle["core_inner_color"] + (0,))
    core_inner_alpha = core_inner_mask.point(lambda v: int(v * (0.55 * strength)))
    core_inner.putalpha(core_inner_alpha)
    frame = Image.alpha_composite(frame.convert("RGBA"), core_inner).convert("RGB")

    return frame


def build_preview(image, candles):
    preview = image.copy().convert("RGBA")
    draw = ImageDraw.Draw(preview)
    for c in candles:
        draw.rectangle(c["bbox"], outline=(0, 255, 255, 220), width=3)
        cx, cy = c["flame_center"]
        r = c["glow_radius"]
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(255, 200, 0, 180), width=2)
    return preview.convert("RGB")


def generate_frames(image, frames, fps):
    rng = random.Random(1337)
    size = image.size

    per_candle = []
    for candle in CANDLES:
        per_candle.append(
            {
                "candle": candle,
                "region_mask": build_soft_mask(size, candle["bbox"], blur_radius=10),
                "glow_mask": build_radial_mask(size, candle["flame_center"], candle["glow_radius"]),
                "core_outer_mask": build_radial_mask(
                    size, candle["flame_center"], candle["core_outer_radius"]
                ),
                "core_inner_mask": build_radial_mask(
                    size, candle["flame_center"], candle["core_inner_radius"]
                ),
                "phase": rng.uniform(0, math.tau),
            }
        )

    out = []
    for i in range(frames):
        t = i / frames
        frame = image.copy()
        for item in per_candle:
            # Mix slow sine with random jitter for natural flicker.
            base = 0.55 + 0.15 * math.sin((t * math.tau * 1.2) + item["phase"])
            jitter = rng.uniform(-0.06, 0.10)
            strength = max(0.15, min(1.0, base + jitter))
            frame = apply_flicker(
                frame,
                item["candle"],
                strength,
                item["region_mask"],
                item["glow_mask"],
                item["core_outer_mask"],
                item["core_inner_mask"],
            )
        out.append(frame)

    duration_ms = int(1000 / fps)
    return out, duration_ms


def main():
    parser = argparse.ArgumentParser(
        description="Animate candle flicker on the grimoire image and export as GIF."
    )
    parser.add_argument("--input", default=DEFAULT_INPUT)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--frames", type=int, default=24)
    parser.add_argument("--fps", type=int, default=20)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    image = Image.open(input_path).convert("RGB")

    if args.preview:
        preview = build_preview(image, CANDLES)
        preview_path = output_path.with_suffix(".preview.png")
        preview.save(preview_path)
        print(f"Preview saved to: {preview_path}")

    frames, duration_ms = generate_frames(image, args.frames, args.fps)
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=duration_ms,
        loop=0,
        disposal=2,
    )
    print(f"GIF saved to: {output_path}")


if __name__ == "__main__":
    main()
