from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "app" / "icons"


def rounded_gradient(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gradient = Image.new("RGBA", (size, size))
    pixels = gradient.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(size - 1, 1))
            pixels[x, y] = (
                int(36 * (1 - t) + 18 * t),
                int(54 * (1 - t) + 26 * t),
                int(93 * (1 - t) + 46 * t),
                255,
            )
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.23), fill=255)
    image.paste(gradient, (0, 0), mask)
    return image


def draw_icon(size: int) -> Image.Image:
    image = rounded_gradient(size)
    draw = ImageDraw.Draw(image)
    scale = size / 512
    def box(coords):
        return tuple(int(value * scale) for value in coords)

    draw.rectangle(box((113, 122, 399, 390)), fill=(255, 255, 255, 20))
    for coords in ((147, 156, 365, 184), (147, 214, 271, 238), (147, 268, 365, 292), (147, 322, 239, 346)):
        draw.rounded_rectangle(box(coords), radius=max(1, int(4 * scale)), fill=(255, 255, 255, 232))

    draw.ellipse(box((256, 262, 400, 406)), fill=(246, 163, 63, 255))
    width = max(3, int(20 * scale))
    draw.line([box((292, 334)), box((315, 357)), box((364, 300))], fill=(23, 35, 61, 255), width=width, joint="curve")
    return image


OUT.mkdir(parents=True, exist_ok=True)
for icon_size in (192, 512):
    draw_icon(icon_size).save(OUT / f"icon-{icon_size}.png", "PNG", optimize=True)
