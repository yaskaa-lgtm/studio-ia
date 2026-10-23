"""Subset the local Montserrat variable font to Latin + French glyphs and export WOFF2.

Source: $KIWI_ASSETS/fonts/Montserrat.ttf (OFL, local brand assets folder). Output: src/assets/fonts/.
Requires: fonttools + brotli (uv pip install fonttools brotli).
"""
from pathlib import Path
import os
import shutil

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = Path(os.environ["KIWI_ASSETS"])  # local brand assets folder (not in the repo)
SRC = ASSETS / "fonts" / "Montserrat.ttf"
OFL = ASSETS / "fonts" / "OFL-Montserrat.txt"
OUT = ROOT / "src" / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

font = TTFont(SRC)
axes = [(a.axisTag, a.minValue, a.maxValue) for a in font["fvar"].axes] if "fvar" in font else []
print("axes:", axes)

# Basic Latin, Latin-1, Latin Extended-A (Œ œ), punctuation, €, arrows, ×, →
unicodes = "U+0020-007E,U+00A0-00FF,U+0152-0153,U+0178,U+2010-2027,U+202F,U+2030-203A,U+20AC,U+2190-2193,U+2212,U+00D7,U+2715"
opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["kern", "liga", "tnum", "lnum", "case", "calt"]
opts.name_IDs = ["*"]
opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(unicodes=subset.parse_unicodes(unicodes))
sub.subset(font)
dest = OUT / "montserrat-latin-var.woff2"
font.flavor = "woff2"
font.save(dest)
shutil.copy(OFL, OUT / "OFL-Montserrat.txt")
print(dest, dest.stat().st_size, "bytes")
