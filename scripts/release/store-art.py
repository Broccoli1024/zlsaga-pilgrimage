from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[2]
out=root/'release/google-play/assets'
cream='#fdfaf5';red='#8b2500';sand='#e2d4bc';green='#55755d'
# Original geometric artwork: folded map + route pin. No third-party characters.
def icon(size,foreground=False):
 scale=3
 im=Image.new('RGBA',(size*scale,size*scale),(0,0,0,0) if foreground else cream)
 d=ImageDraw.Draw(im)
 def pts(p):return [(int(x*size*scale/512),int(y*size*scale/512)) for x,y in p]
 # Keep adaptive foreground inside the central safe area.
 if foreground:
  base=icon(512)
  base.putalpha(255)
  base=base.resize((int(size*scale*.58),int(size*scale*.58)),Image.Resampling.LANCZOS)
  im.alpha_composite(base,((size*scale-base.width)//2,(size*scale-base.height)//2))
 else:
  d.polygon(pts([(80,174),(194,138),(316,174),(432,138),(432,364),(316,400),(194,364),(80,400)]),fill=sand)
  d.polygon(pts([(194,138),(316,174),(316,400),(194,364)]),fill='#eee3d1')
  d.line(pts([(110,335),(168,296),(231,320),(285,270),(357,293),(403,261)]),fill=green,width=int(size*scale*12/512),joint='curve')
  d.ellipse(pts([(226,94),(350,218)]),fill=red)
  d.polygon(pts([(230,176),(346,176),(288,270)]),fill=red)
  d.ellipse(pts([(265,133),(311,179)]),fill=cream)
 return im.resize((size,size),Image.Resampling.LANCZOS)
icon(512).save(out/'icon-512.png')
font='/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc'
small='/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'
im=Image.new('RGB',(1024,500),cream);d=ImageDraw.Draw(im)
d.line([(0,420),(260,340),(400,410),(760,305),(1024,360)],fill='#ede5d8',width=45)
im.paste(icon(300).convert('RGB'),(45,92))
d.text((380,135),'ピルグリマップ',font=ImageFont.truetype(font,58),fill=red)
d.text((384,226),'佐賀を巡る。思い出を残す。',font=ImageFont.truetype(small,28),fill='#40372e')
d.text((384,294),'スポット検索  /  ルート作成  /  訪問記録',font=ImageFont.truetype(small,20),fill='#6b5e50')
im.save(out/'feature-1024x500.png')
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
 folder=root/'android/app/src/main/res'/('mipmap-'+density)
 folder.mkdir(exist_ok=True)
 for name in ['ic_launcher.png','ic_launcher_round.png']:icon(size).save(folder/name)
 icon(int(size*2.25),True).save(folder/'ic_launcher_foreground.png')
print('Created store artwork and Android launcher icons.')
