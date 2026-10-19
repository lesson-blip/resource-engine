#!/bin/bash
# usage: qa/grid.sh file.pptx|file.pdf prefix [dpi]  -> .cache/grid/<prefix>gNN.jpg (12 per sheet)
F=$1; P=$2; D=${3:-50}; OUT=.cache/grid; mkdir -p $OUT; rm -f $OUT/${P}*
case "$F" in
  *.pptx) python3 /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir $OUT "$F" >/dev/null 2>&1; PDF=$OUT/$(basename "$F" .pptx).pdf ;;
  *) PDF=$F ;;
esac
pdftoppm -jpeg -r $D "$PDF" $OUT/${P}s
python3 - "$OUT" "$P" <<'PY'
import sys,glob
from PIL import Image
o,p=sys.argv[1],sys.argv[2]
fs=sorted(glob.glob(f'{o}/{p}s-*.jpg'))
for k in range(0,len(fs),12):
  ims=[Image.open(f) for f in fs[k:k+12]];w,h=ims[0].size
  cols=3 if w>h else 4; rows=(len(ims)+cols-1)//cols
  g=Image.new('RGB',(w*cols,h*rows),'white')
  for i,im in enumerate(ims): g.paste(im.resize((w,h)),((i%cols)*w,(i//cols)*h))
  g.save(f'{o}/{p}g{k//12:02d}.jpg')
print(len(fs),'pages')
PY
