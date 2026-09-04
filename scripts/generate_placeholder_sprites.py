"""Generates placeholder pixel-art sprites for PixelOS.
Non-scaled, hand-plotted pixel PNGs matching assets/sprites/manifest.json.
Replace these later in Pixilart without touching any code.
"""
from PIL import Image
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "sprites")
os.makedirs(OUT, exist_ok=True)

TRANSPARENT = (0, 0, 0, 0)


def new_img(w, h):
    return Image.new("RGBA", (w, h), TRANSPARENT)


def px(img, x, y, color):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), color)


def rect(img, x0, y0, x1, y1, color):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(img, x, y, color)


def rect_outline(img, x0, y0, x1, y1, color):
    for x in range(x0, x1 + 1):
        px(img, x, y0, color)
        px(img, x, y1, color)
    for y in range(y0, y1 + 1):
        px(img, x0, y, color)
        px(img, x1, y, color)


def save(img, name):
    path = os.path.join(OUT, f"{name}.png")
    img.save(path)
    print("wrote", path, img.size)


# ---------- icon_productivity: clipboard/checklist, 16x16 ----------
img = new_img(16, 16)
BOARD = (196, 164, 108, 255)
PAPER = (240, 235, 220, 255)
LINE = (90, 90, 100, 255)
CHECK = (86, 176, 96, 255)
rect(img, 3, 1, 12, 14, BOARD)
rect_outline(img, 3, 1, 12, 14, (120, 92, 56, 255))
rect(img, 4, 3, 11, 13, PAPER)
rect(img, 6, 0, 9, 2, (150, 150, 160, 255))
for row_y in (5, 7, 9, 11):
    rect(img, 5, row_y, 6, row_y, CHECK)
    rect(img, 8, row_y, 10, row_y, LINE)
save(img, "icon_productivity")

# ---------- icon_music: eighth note, 16x16 ----------
img = new_img(16, 16)
NOTE = (176, 96, 210, 255)
rect(img, 10, 2, 11, 9, NOTE)
rect(img, 12, 2, 12, 4, NOTE)
rect(img, 11, 3, 12, 3, NOTE)
# note heads (two blobs, ellipse-ish)
head_pixels = [(-2, -1), (-1, -2), (0, -2), (1, -1), (1, 0), (0, 1), (-1, 1), (-2, 0)]
def blob(cx, cy, color):
    rect(img, cx - 1, cy - 1, cx + 1, cy + 1, color)
    for dx, dy in head_pixels:
        px(img, cx + dx, cy + dy, color)
blob(5, 12, NOTE)
blob(9, 10, NOTE)
save(img, "icon_music")

# ---------- icon_emulation: gamepad, 16x16 ----------
img = new_img(16, 16)
BODY = (220, 140, 40, 255)
DARK = (150, 90, 20, 255)
BTN = (240, 240, 240, 255)
rect(img, 1, 6, 14, 11, BODY)
rect(img, 2, 5, 13, 5, BODY)
rect(img, 2, 12, 13, 12, BODY)
rect_outline(img, 1, 5, 14, 12, DARK)
# d-pad
rect(img, 3, 8, 5, 8, DARK)
rect(img, 4, 7, 4, 9, DARK)
# buttons
px(img, 11, 7, BTN)
px(img, 12, 8, BTN)
px(img, 10, 8, BTN)
px(img, 11, 9, BTN)
save(img, "icon_emulation")

# ---------- icon_settings: gear, 16x16 ----------
img = new_img(16, 16)
GEAR = (150, 160, 176, 255)
DARK = (90, 98, 112, 255)
teeth = [(7,1),(8,1),(7,14),(8,14),(1,7),(1,8),(14,7),(14,8),
         (3,3),(12,3),(3,12),(12,12)]
for (x, y) in teeth:
    rect(img, x, y, x+1 if x < 14 else x, y, GEAR)
rect(img, 4, 4, 11, 11, GEAR)
rect_outline(img, 4, 4, 11, 11, DARK)
rect(img, 6, 6, 9, 9, TRANSPARENT)
rect_outline(img, 6, 6, 9, 9, DARK)
save(img, "icon_settings")

# ---------- icon_calculator: 16x16 ----------
img = new_img(16, 16)
CASE = (60, 66, 90, 255)
SCREEN = (150, 200, 150, 255)
KEY = (210, 210, 220, 255)
rect(img, 2, 1, 13, 14, CASE)
rect_outline(img, 2, 1, 13, 14, (30, 34, 48, 255))
rect(img, 4, 3, 11, 5, SCREEN)
for ky in (7, 10, 13):
    for kx in (4, 7, 10):
        rect(img, kx, ky, kx + 1, ky, KEY)
save(img, "icon_calculator")

# ---------- cursor: 8x8 arrow ----------
img = new_img(8, 8)
BLACK = (20, 20, 24, 255)
WHITE = (255, 255, 255, 255)
arrow = [
    (0,0),(0,1),(0,2),(0,3),(0,4),(0,5),(0,6),
    (1,1),(1,2),(1,3),(1,4),(1,5),
    (2,2),(2,3),(2,4),
    (3,3),(3,4),(3,5),
    (4,4),(4,5),
    (2,6),(3,6),
]
for (x, y) in arrow:
    px(img, x, y, WHITE)
outline = [(1,0),(0,7),(1,7),(2,7),(2,5),(3,7),(4,6),(5,5),(4,3),(3,2),(2,1)]
for (x, y) in outline:
    px(img, x, y, BLACK)
save(img, "cursor")

# ---------- btn_close: 8x8 red X ----------
img = new_img(8, 8)
RED = (200, 60, 60, 255)
DARKRED = (130, 30, 30, 255)
rect(img, 0, 0, 7, 7, RED)
rect_outline(img, 0, 0, 7, 7, DARKRED)
for i in range(1, 7):
    px(img, i, i, DARKRED)
    px(img, 7 - i, i, DARKRED)
save(img, "btn_close")

# ---------- btn_minimize: 8x8 yellow dash ----------
img = new_img(8, 8)
YEL = (216, 176, 60, 255)
DARKYEL = (140, 108, 30, 255)
rect(img, 0, 0, 7, 7, YEL)
rect_outline(img, 0, 0, 7, 7, DARKYEL)
rect(img, 1, 5, 6, 6, DARKYEL)
save(img, "btn_minimize")

# ---------- btn_start: 24x16 ----------
img = new_img(24, 16)
BLUE = (60, 110, 200, 255)
DARKBLUE = (30, 60, 130, 255)
LIGHT = (140, 180, 230, 255)
rect(img, 0, 0, 23, 15, BLUE)
rect_outline(img, 0, 0, 23, 15, DARKBLUE)
rect(img, 1, 1, 22, 1, LIGHT)
rect(img, 1, 1, 1, 14, LIGHT)
# small pixel "window squares" logo
squares = [(4,5),(4,6),(8,5),(8,6),(4,9),(4,10),(8,9),(8,10)]
for (x, y) in squares:
    rect(img, x, y, x+2, y+2, (255,255,255,255))
save(img, "btn_start")

# ---------- wallpaper_tile: 32x32 seamless checker/diamond ----------
img = new_img(32, 32)
BG1 = (34, 32, 64, 255)
BG2 = (44, 42, 84, 255)
ACCENT = (70, 60, 120, 255)
for y in range(32):
    for x in range(32):
        c = BG1 if ((x // 4) + (y // 4)) % 2 == 0 else BG2
        px(img, x, y, c)
for i in range(0, 32, 8):
    rect(img, i, 0, i, 31, ACCENT)
    rect(img, 0, i, 31, i, ACCENT)
save(img, "wallpaper_tile")

# ---------- boot_logo: 48x16 blocky "PXOS" ----------
img = new_img(48, 16)
INK = (230, 230, 240, 255)

def glyph_P(ox):
    rect(img, ox, 2, ox, 13, INK)
    rect(img, ox, 2, ox+5, 2, INK)
    rect(img, ox, 7, ox+5, 7, INK)
    rect(img, ox+5, 2, ox+5, 7, INK)

def glyph_X(ox):
    for i in range(12):
        px(img, ox+i//2 if False else ox, 2+i, INK)
    for i in range(0, 12):
        px(img, ox + (i * 5 // 11), 2 + i, INK)
        px(img, ox + 5 - (i * 5 // 11), 2 + i, INK)

def glyph_O(ox):
    rect_outline(img, ox, 2, ox+5, 13, INK)

def glyph_S(ox):
    rect(img, ox, 2, ox+5, 2, INK)
    rect(img, ox, 3, ox, 6, INK)
    rect(img, ox, 7, ox+5, 7, INK)
    rect(img, ox+5, 8, ox+5, 11, INK)
    rect(img, ox, 12, ox+5, 12, INK)

glyph_P(2)
glyph_X(10)
glyph_O(18)
glyph_S(26)
save(img, "boot_logo")

print("done")
