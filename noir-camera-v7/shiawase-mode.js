(()=>{
const frac=x=>x-Math.floor(x);
const rnd=(i,k=0)=>frac(Math.sin(i*127.1+k*311.7)*43758.5453);
function tex(image){const t=new THREE.CanvasTexture(image);t.colorSpace=THREE.SRGBColorSpace;return t}
function negative(source,kind){
 const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
 const q=c.getContext('2d');q.drawImage(source,0,0);const im=q.getImageData(0,0,c.width,c.height),d=im.data;
 for(let i=0;i<d.length;i+=4){
  let r=d[i],g=d[i+1],b=d[i+2];
  if(kind==='mono'){const l=.2126*r+.7152*g+.0722*b;r=g=b=255-l}
  else if(kind==='ghost'){const l=.2126*r+.7152*g+.0722*b;r=155-l*.30;g=185-l*.42;b=220-l*.42}
  else if(kind==='negative'){r=255-r;g=255-g;b=255-b}
  else {r=255-r*.94;g=255-g*.88;b=255-b*.97}
  d[i]=r;d[i+1]=g;d[i+2]=b;
 }
 q.putImageData(im,0,0);return c;
}
function crop(source,r){const c=document.createElement('canvas');c.width=128;c.height=128;
 const q=c.getContext('2d');q.drawImage(source,r.x,r.y,r.w,r.h,0,0,128,128);return tex(c)}
function build(group,source,second,opts={}){
 const T=THREE,kind=opts.source||'invert',other=kind==='picb'&&second?second:negative(source,kind);
 const count=Math.max(12,Math.min(48,opts.cubes||26)),lines=Math.max(24,Math.min(600,opts.lines||190));
 const unit=Math.max(source.width,source.height),ratio=source.width/unit;
 const W=ratio*1.44,H=source.height/unit*1.44,gap=2.05;
 const left=-gap/2-W/2,right=gap/2+W/2;
 const pair=[{im:source,x:left,rotation:.13},{im:other,x:right,rotation:-.13}];
 for(const p of pair){
  const plane=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:tex(p.im),side:T.DoubleSide,transparent:true,opacity:.93,depthWrite:false}));
  plane.position.set(p.x,.1,-.23);plane.rotation.y=p.rotation;plane.userData.shiawaseScreen=true;group.add(plane);
  const glow=new T.Mesh(new T.PlaneGeometry(W*1.055,H*1.055),new T.MeshBasicMaterial({color:0xbac6d7,transparent:true,opacity:.048,side:T.DoubleSide,depthWrite:false}));
  glow.position.set(p.x,.1,-.245);group.add(glow);
 }
 // Sample corresponding normalized image positions on the paired planes.
 const positions=[];
 for(let i=0;i<lines;i++){
  const u=rnd(i+7,3),v=rnd(i+11,9),y=(.5-v)*H+.1;
  const xOffset=(u-.5)*W;
  positions.push(left+xOffset,y,-.225,right+xOffset,y,-.225);
 }
 const wire=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(positions,3)),
 new T.LineBasicMaterial({color:0xb8c9da,transparent:true,opacity:.12,depthWrite:false}));
 wire.userData.shiawaseLines=true;group.add(wire);
 for(let i=0;i<count;i++){
  const u=.08+rnd(i,2)*.84,v=.08+rnd(i,5)*.84;
  const fraction=.09+rnd(i,7)*.18;
  const patchW=Math.max(5,Math.floor(source.width*fraction)),patchH=Math.max(5,Math.floor(source.height*fraction));
  const rect={x:Math.floor(u*(source.width-patchW)),y:Math.floor(v*(source.height-patchH)),w:patchW,h:patchH};
  const sz=.048+Math.pow(rnd(i,10),2)*.26;
  const materials=[source,other,source,other,source,other].map(im=>new T.MeshBasicMaterial({
   map:crop(im,rect),transparent:true,opacity:.76+.2*rnd(i,12),side:T.DoubleSide
  }));
  const cube=new T.Mesh(new T.BoxGeometry(sz,sz,sz*(.65+rnd(i,13))),materials);
  cube.position.set((rnd(i,14)-.5)*gap*1.05,(rnd(i,15)-.5)*H+.1,(rnd(i,16)-.5)*1.1);
  cube.rotation.set(rnd(i,17)*.9,rnd(i,18)*1.5,rnd(i,19)*.8);
  cube.userData.shiawaseCube=true;group.add(cube);
 }
 const floorY=-H*.69;
 const floor=new T.Mesh(new T.PlaneGeometry(8,5),new T.MeshBasicMaterial({color:0x191b20,side:T.DoubleSide,depthWrite:false}));
 floor.rotation.x=-Math.PI/2;floor.position.set(0,floorY,.3);floor.userData.shiawaseFloor=true;group.add(floor);
 for(const p of pair){
  const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
  ctx.filter='blur(18px)';ctx.globalAlpha=.48;ctx.drawImage(p.im,0,0,256,256);
  const fade=ctx.createLinearGradient(0,0,0,256);fade.addColorStop(0,'rgba(255,255,255,.55)');fade.addColorStop(1,'rgba(255,255,255,0)');
  ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,256,256);
  const reflection=new T.Mesh(new T.PlaneGeometry(W*1.15,1.13),new T.MeshBasicMaterial({
   map:tex(c),side:T.DoubleSide,transparent:true,opacity:.20,depthWrite:false
  }));
  reflection.rotation.x=-Math.PI/2;reflection.position.set(p.x,floorY+.012,.02);group.add(reflection);
 }
 return group.children;
}
window.ShiawaseMode={build};
})();