"""Cut a person out of a photo (rembg, local model) and trim to the figure.
usage: python3 src/cutout.py in.jpg out.png"""
import sys
from rembg import remove, new_session
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im.thumbnail((1600, 1600))
res = remove(im, session=new_session("u2net_human_seg"), alpha_matting=True, alpha_matting_foreground_threshold=240, alpha_matting_background_threshold=10)
bbox = res.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
if bbox: res = res.crop(bbox)
res.save(out)
print("cut", out, res.size)
