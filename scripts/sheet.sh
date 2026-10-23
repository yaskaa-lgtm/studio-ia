#!/usr/bin/env bash
# Contact sheet: scripts/sheet.sh <prefix> <cols> <tilewidth> -> _work/sheet-<prefix>.png
set -e
cd "$(dirname "$0")/../_work/shots"
P="$1"; C="${2:-3}"; TW="${3:-720}"
T=../tmp-sheet; rm -rf $T; mkdir -p $T
i=0; for f in $(ls ${P}-*.png | sort); do cp "$f" $T/$(printf %02d $i).png; i=$((i+1)); done
R=$(( (i + C - 1) / C ))
ffmpeg -v error -y -i "$T/%02d.png" -vf "scale=${TW}:-1,tile=${C}x${R}:padding=8:color=0xff0000" -frames:v 1 "../sheet-${P}.png"
echo "../_work/sheet-${P}.png ($i shots)"
