"""Build the Open Graph image (public/og.jpg, 1200x630) with ffmpeg and a static Montserrat 800 instance."""
from pathlib import Path
import os
import subprocess

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
W = ROOT / "_work"
W.mkdir(exist_ok=True)
for wght, name in [(800, "M800.ttf"), (500, "M500.ttf")]:
    f = instancer.instantiateVariableFont(TTFont(Path(os.environ["KIWI_ASSETS"]) / "fonts" / "Montserrat.ttf"), {"wght": wght})
    f.save(W / name)

# one drawtext per line (ffmpeg's line_spacing uses the instanced font's large line gap)
lines = ["Des pubs verticales", "de 20 à 40 s,", "livrées en", "quelques jours."]
draw = []
for i, line in enumerate(lines):
    (W / f"og-l{i}.txt").write_text(line, encoding="utf-8")
    draw.append(f"drawtext=fontfile=M800.ttf:textfile=og-l{i}.txt:fontsize=66:fontcolor=0x15151A:x=60:y={96 + i * 82}")
(W / "og-sub.txt").write_text("KIWIBYTE Studio  ·  vidéos produites avec l’I.A.  ·  dès 149 €", encoding="utf-8")
M = ROOT / "public" / "media"
fc = (
    "[1]scale=190:338[a];[2]scale=222:395[b];[3]scale=190:338[c];"
    "[0][a]overlay=780:150[t1];[t1][c]overlay=975:150[t2];[t2][b]overlay=868:118,"
    "drawbox=x=162:y=212:w=288:h=22:color=0x34D399:t=fill,"
    + ",".join(draw)
    + ",drawtext=fontfile=M500.ttf:textfile=og-sub.txt:fontsize=24:fontcolor=0x4A4740:x=60:y=548"
)
subprocess.run(
    ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0xF1EBDF:s=1200x630",
     "-i", str(M / "pont-usb-c.webp"), "-i", str(M / "cas-client.webp"), "-i", str(M / "studio-voix.webp"),
     "-filter_complex", fc, "-frames:v", "1", "-q:v", "3", "-map_metadata", "-1", str(ROOT / "public" / "og.jpg")],
    check=True, cwd=W,
)
print((ROOT / "public" / "og.jpg").stat().st_size, "bytes")
