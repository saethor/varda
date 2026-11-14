"""Build the final Varða logo files.

Run from the repo root:
    .venv/bin/python logo/build/build_logo.py

Everything is pure vector output: the VARÐA letters are hand-drawn shapes and the
tagline is converted to outlines from Avenir Next Demi Bold with fontTools, so the
SVGs do not depend on any installed font.
"""
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTCollection

OUT = Path(__file__).resolve().parent.parent / "final"
OUT.mkdir(exist_ok=True)

# ---------------------------------------------------------------- palette
BASALT, MOSS, LICHEN, SNOW = "#2B2E2F", "#5E7A4E", "#B5C26A", "#F3F1EC"
THEMES = {
    "light": dict(ink=BASALT, accent=MOSS),   # on snow / white
    "dark": dict(ink=SNOW, accent=LICHEN),    # on basalt
}

# ---------------------------------------------------------------- the mark (B · split cairn)
# Five stones = five kilometres. Each one is shorter (faster) than the one below:
# a negative-split run. The top stone, the fastest km, is the accent colour.
MARK_W, MARK_H = 140, 128  # bounding box of the stones in mark units
STONES = [  # x, y, w (relative to the mark's top-left), height 20, rx 4
    (0, 108, 140), (10, 81, 120), (20, 54, 100), (31, 27, 78), (44, 0, 52),
]


def mark(t, x, y, scale):
    rects = []
    for i, (sx, sy, sw) in enumerate(STONES):
        fill = t["accent"] if i == len(STONES) - 1 else t["ink"]
        rects.append(f'<rect x="{sx}" y="{sy}" width="{sw}" height="20" rx="4" fill="{fill}"/>')
    return f'<g transform="translate({x:g} {y:g}) scale({scale:g})">{"".join(rects)}</g>'


# ---------------------------------------------------------------- VARÐA letterforms
# Cap height 60 (y 0..60), stroke 11. Each glyph returns (svg, ink_width).
CAP_H, STROKE = 60, 11


def glyph_V(c):
    return f'<polygon fill="{c}" points="0,0 12,0 25,45 38,0 50,0 31,60 19,60"/>', 50


def glyph_A(c):
    return (f'<polygon fill="{c}" points="19,0 31,0 50,60 38,60 25,16 12,60 0,60"/>'
            f'<rect x="11" y="38" width="28" height="9" fill="{c}"/>'), 50


def glyph_R(c):
    # stem + bowl drawn as strokes; the leg is a parallel-sided polygon that grows out of
    # the bottom of the bowl and lands flat on the baseline.
    s = STROKE
    return (f'<g fill="none" stroke="{c}" stroke-width="{s}">'
            f'<line x1="{s / 2}" y1="0" x2="{s / 2}" y2="60"/>'
            f'<path d="M0,{s / 2} H20 A14,14 0 0 1 20,{28 + s / 2} H0"/></g>'
            f'<polygon fill="{c}" points="9.7,30 22.7,30 42,60 29,60"/>'), 42


def glyph_ETH(c, bar):
    # Ð: a D whose crossbar is a small stone in the accent colour (the cairn's capstone).
    s = STROKE
    return (f'<g fill="none" stroke="{c}" stroke-width="{s}">'
            f'<line x1="{6 + s / 2}" y1="0" x2="{6 + s / 2}" y2="60"/>'
            f'<path d="M6,{s / 2} H26 A{24.5},{24.5} 0 0 1 26,{60 - s / 2} H6"/></g>'
            f'<rect x="0" y="25.5" width="28" height="9" rx="2" fill="{bar}"/>'), 56


# Advance positions, spaced optically rather than by bounding box:
#   V→A   parallel diagonals, nested
#   A→R   diagonal to straight stem, measured at the baseline
#   R→Ð   bowl to stem; the Ð's stone overhang sits in the gap
#   Ð→A   round to diagonal, measured at mid-height
POSITIONS = {"V": 0, "A1": 42, "R": 97.5, "ETH": 142, "A2": 198.5}
WORD_W = POSITIONS["A2"] + 50


def word(t, x, y):
    c = t["ink"]
    parts = [
        ("V", glyph_V(c)[0]), ("A1", glyph_A(c)[0]), ("R", glyph_R(c)[0]),
        ("ETH", glyph_ETH(c, t["accent"])[0]), ("A2", glyph_A(c)[0]),
    ]
    inner = "".join(f'<g transform="translate({POSITIONS[k]:g} 0)">{svg}</g>' for k, svg in parts)
    # clip to the cap height so stroke ends and the R leg sit exactly on baseline / cap line
    return (f'<g transform="translate({x:g} {y:g})" clip-path="url(#capclip)">{inner}</g>')


CLIP = f'<clipPath id="capclip"><rect x="-10" y="0" width="{WORD_W + 20}" height="{CAP_H}"/></clipPath>'

# ---------------------------------------------------------------- tagline, outlined
TAGLINE = "ONE STONE AT A TIME"
_font = TTCollection("/System/Library/Fonts/Avenir Next.ttc").fonts[2]  # Avenir Next Demi Bold
_gs, _cmap, _hmtx = _font.getGlyphSet(), _font.getBestCmap(), _font["hmtx"]
UPM = _font["head"].unitsPerEm
TAG_SIZE = 11.5  # px


def _tagline_paths(size, tracking):
    """Return (svg path d, total ink width) for the tagline at a given tracking (px)."""
    k = size / UPM
    x, ds, last_adv = 0.0, [], 0.0
    for ch in TAGLINE:
        g = _cmap[ord(ch)]
        adv = _hmtx[g][0] * k
        if ch != " ":
            pen = SVGPathPen(_gs)
            _gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, 0)))  # flip y: font units are y-up
            ds.append(pen.getCommands())
        x += adv + tracking
        last_adv = adv
    width = x - tracking  # no tracking after the last letter
    return " ".join(ds), width


def _tracking_for(width_target):
    lo, hi = 0.0, 20.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if _tagline_paths(TAG_SIZE, mid)[1] < width_target:
            lo = mid
        else:
            hi = mid
    return lo


# the tagline spans the word, so it sits centred under VARÐA with matching edges
TAG_TRACK = _tracking_for(WORD_W - 2)
TAG_D, TAG_W = _tagline_paths(TAG_SIZE, TAG_TRACK)


def tagline(t, cx, baseline):
    return f'<path transform="translate({cx - TAG_W / 2:.2f} {baseline:g})" fill="{t["accent"]}" d="{TAG_D}"/>'


# ---------------------------------------------------------------- lockups
TAG_GAP = 22  # cap baseline → tagline baseline


def svg(w, h, title, body, bg=None):
    rect = f'<rect width="{w:g}" height="{h:g}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" width="{w:g}" height="{h:g}">\n'
            f'  <title>{title}</title>\n  <defs>{CLIP}</defs>\n  {rect}' + "\n  ".join(body) + "\n</svg>\n")


def horizontal(t):
    pad = 24
    block_h = CAP_H + TAG_GAP                    # cap top → tagline baseline
    scale = block_h / MARK_H                     # mark matches the text block height
    mw = MARK_W * scale
    gap = 30
    wx = pad + mw + gap
    w, h = wx + WORD_W + pad, block_h + 2 * pad
    return w, h, [mark(t, pad, pad, scale), word(t, wx, pad), tagline(t, wx + WORD_W / 2, pad + block_h)]


def stacked(t):
    pad = 24
    scale = 0.72
    mw, mh = MARK_W * scale, MARK_H * scale
    w = WORD_W + 2 * pad
    gap = 26
    wy = pad + mh + gap
    h = wy + CAP_H + TAG_GAP + pad
    return w, h, [mark(t, (w - mw) / 2, pad, scale), word(t, pad, wy), tagline(t, w / 2, wy + CAP_H + TAG_GAP)]


def wordmark(t):
    pad = 12
    return WORD_W + 2 * pad, CAP_H + 2 * pad, [word(t, pad, pad)]


def wordmark_tagline(t):
    pad = 16
    return WORD_W + 2 * pad, CAP_H + TAG_GAP + 2 * pad + 2, [word(t, pad, pad), tagline(t, pad + WORD_W / 2, pad + CAP_H + TAG_GAP)]


def mark_only(t):
    pad = 30
    return MARK_W + 2 * pad, MARK_H + 2 * pad, [mark(t, pad, pad, 1)]


def app_icon():
    t = THEMES["dark"]
    scale = 2.3
    mw, mh = MARK_W * scale, MARK_H * scale
    return 512, 512, [f'<rect width="512" height="512" rx="112" fill="{BASALT}"/>',
                      mark(t, (512 - mw) / 2, (512 - mh) / 2 - 4, scale)]


FILES = {
    "varda-logo": horizontal,
    "varda-logo-stacked": stacked,
    "varda-wordmark": wordmark,
    "varda-wordmark-tagline": wordmark_tagline,
    "varda-mark": mark_only,
}

for name, fn in FILES.items():
    for theme, t in THEMES.items():
        w, h, body = fn(t)
        sfx = "-dark" if theme == "dark" else ""
        (OUT / f"{name}{sfx}.svg").write_text(svg(w, h, f"Varða — {name} ({theme})", body))

w, h, body = app_icon()
(OUT / "varda-app-icon.svg").write_text(svg(w, h, "Varða — app icon", body))
print(f"wrote {len(list(OUT.glob('*.svg')))} files to {OUT}  (tagline tracking {TAG_TRACK:.2f}px)")
