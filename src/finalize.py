import zipfile, sys, re, shutil
src=sys.argv[1]; tmp=src+'.tmp'
zin=zipfile.ZipFile(src); names=[n for n in zin.namelist() if not n.endswith('/')]
names.sort(key=lambda n: 0 if n=='[Content_Types].xml' else 1)
# de-duplicate identical media (the same photo or icon used on many slides) and point every slide at one copy
import hashlib
canon={}; drop={}
for n in names:
    if n.startswith('ppt/media/'):
        h=hashlib.md5(zin.read(n)).hexdigest()
        if h in canon: drop[n]=canon[h]
        else: canon[h]=n
with zipfile.ZipFile(tmp,'w',zipfile.ZIP_DEFLATED) as zout:
    for n in names:
        if n in drop: continue
        data=zin.read(n)
        if drop and n.endswith('.rels'):
            x=data.decode()
            for d,c in drop.items():
                x=x.replace('../media/'+d.split('/')[-1]+'"','../media/'+c.split('/')[-1]+'"')
            data=x.encode()
        zout.writestr(n, data)
if drop: print('media deduped', len(drop))
shutil.move(tmp,src)
# overlap check
z=zipfile.ZipFile(src); E=914400; bad=0
for n in sorted(z.namelist(), key=lambda s:(len(s),s)):
    m=re.match(r'ppt/slides/slide(\d+)\.xml$',n)
    if not m: continue
    x=z.read(n).decode()
    rects=[]
    for blk in re.findall(r'<p:(?:sp|pic)>.*?</p:(?:sp|pic)>',x,re.S):
        if 'prst="line"' in blk or 'descr="underlay' in blk or 'descr="hotspot' in blk: continue
        o=re.search(r'<a:off x="(\d+)" y="(\d+)"/><a:ext cx="(\d+)" cy="(\d+)"/>',blk)
        if not o: continue
        a,b,c,d=[int(v)/E for v in o.groups()]
        t=''.join(re.findall(r'<a:t>([^<]*)</a:t>',blk))[:30] or ('[img]' if '<p:pic>' in blk else '[shape]')
        rects.append((a,b,a+c,b+d,t))
        if a<-0.01 or b<-0.01 or a+c>13.34 or b+d>7.51: print('OFFSLIDE',m.group(1),t); bad+=1
    for i in range(len(rects)):
        for j in range(i+1,len(rects)):
            A=rects[i];B=rects[j]
            ox=min(A[2],B[2])-max(A[0],B[0]); oy=min(A[3],B[3])-max(A[1],B[1])
            inside=lambda P,Q: P[0]>=Q[0]-0.01 and P[1]>=Q[1]-0.01 and P[2]<=Q[2]+0.01 and P[3]<=Q[3]+0.01
            # a box fully inside an empty background card is deliberate layering, not a clash
            if (inside(A,B) and B[4] in('[shape]','')) or (inside(B,A) and A[4] in('[shape]','')): continue
            if ox>0.02 and oy>0.02:
                print('OVERLAP slide',m.group(1),'|',A[4],'|',B[4], round(ox,2),round(oy,2)); bad+=1
print('issues',bad)
