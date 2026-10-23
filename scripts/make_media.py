"""Build the lightweight media for the landing page from real KIWIBYTE shorts.

- 5 muted vertical loops (360x640, 6 s, H.264, no audio) + WebP posters
- 1 atlas video (5 clips side by side, 5 x 192x342) used as a single WebGL texture
- emblem / favicon PNGs, grain tile
Sources: $KIWI_SHORTS/*/short.mp4 and $KIWI_ASSETS (local only, never shipped as-is).
"""
from pathlib import Path
import os
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SHORTS = Path(os.environ["KIWI_SHORTS"])
ASSETS = Path(os.environ["KIWI_ASSETS"])
PUB = ROOT / "public" / "media"
PUB.mkdir(parents=True, exist_ok=True)

# (slug, source folder, start second) — start picked on a moment with motion
CLIPS = [
    ("pont-usb-c", "M1-port-usb-c-ia", 3.0),
    ("studio-voix", "R10-voicestudio", 4.0),
    ("schema", "R12-diagram-design", 5.0),
    ("cas-client", "J3-exemple-client-facture-deux-fois", 6.0),
    ("ia-locale", "O1-une-ia-sur-ton-pc", 4.0),
]
DUR = 6


def run(args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


for slug, folder, start in CLIPS:
    src = SHORTS / folder / "short.mp4"
    out = PUB / f"{slug}.mp4"
    run(["-ss", str(start), "-t", str(DUR), "-i", str(src), "-an",
         "-vf", "scale=360:640:flags=lanczos,fps=24,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryslow", "-crf", "30", "-profile:v", "main",
         "-movflags", "+faststart", "-map_metadata", "-1", str(out)])
    run(["-ss", str(start + 1), "-i", str(src), "-frames:v", "1",
         "-vf", "scale=360:640:flags=lanczos", "-c:v", "libwebp", "-quality", "72",
         "-map_metadata", "-1", str(PUB / f"{slug}.webp")])

# Atlas: 5 tiles horizontally (192x342 each -> 960x342; padded to 960x344 for even dims)
inputs, filters = [], []
for i, (slug, folder, start) in enumerate(CLIPS):
    inputs += ["-ss", str(start), "-t", str(DUR), "-i", str(SHORTS / folder / "short.mp4")]
    filters.append(f"[{i}:v]scale=192:344:flags=lanczos,fps=24,setsar=1[v{i}]")
stack = "".join(f"[v{i}]" for i in range(len(CLIPS))) + f"hstack=inputs={len(CLIPS)},format=yuv420p[out]"
run([*inputs, "-filter_complex", ";".join(filters) + ";" + stack, "-map", "[out]", "-an",
     "-c:v", "libx264", "-preset", "veryslow", "-crf", "31", "-profile:v", "main",
     "-movflags", "+faststart", "-map_metadata", "-1", str(PUB / "atlas.mp4")])
run(["-ss", "1", "-i", str(PUB / "atlas.mp4"), "-frames:v", "1", "-c:v", "libwebp", "-quality", "70",
     str(PUB / "atlas.webp")])

# Emblem + icons (transparent PNG, metadata stripped)
emb = ASSETS / "logo-kiwi-detourer-sans-ecritures.png"
for size, name in [(96, "emblem-96.png"), (192, "icon-192.png"), (512, "icon-512.png"), (32, "favicon-32.png")]:
    run(["-i", str(emb), "-vf", f"scale={size}:{size}:flags=lanczos:force_original_aspect_ratio=decrease,pad={size}:{size}:-1:-1:color=0x00000000",
         "-map_metadata", "-1", str(ROOT / "public" / name)])
run(["-i", str(emb), "-vf", "scale=160:-1:flags=lanczos", "-c:v", "libwebp", "-quality", "85", "-map_metadata", "-1",
     str(PUB / "emblem.webp")])

# Grain tile (monochrome noise, alpha-friendly grey)
run(["-f", "lavfi", "-i", "color=c=gray:s=192x192", "-vf", "noise=alls=90:allf=u,format=gray",
     "-frames:v", "1", str(ROOT / "src" / "assets" / "grain.png")])

for f in sorted(PUB.iterdir()):
    print(f"{f.name:22s} {f.stat().st_size/1024:7.1f} KiB")
