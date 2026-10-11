(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fract=v=>v-Math.floor(v);
const rnd=(i,k=0)=>fract(Math.sin((i+1)*127.1+(k+1)*311.7)*43758.5453);
function imageTexture(source,rect,soft=0){
 const c=document.createElement('canvas'),maxSide=720,scale=Math.min(1,maxSide/Math.max(rect.w,rect.h));
 c.width=Math.max(4,Math.round(rect.w*scale));c.height=Math.max(4,Math.round(rect.h*scale));
 const ctx=c.getContext('2d');
 if(soft)ctx.filter='blur('+soft+'px)';
 ctx.drawImage(source,rect.x,rect.y,rect.w,rect.h,0,0,c.width,c.height);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}
function hazeTexture(){
 const c=document.createElement('canvas');c.width=256;c.height=256;
 const g=c.getContext('2d'),colours=[[165,194,219],[215,184,211],[209,222,225]];
 colours.forEach((rgb,i)=>{
  const x=110+Math.cos(i*2.17)*58,y=128+Math.sin(i*1.81)*55;
  const grad=g.createRadialGradient(x,y,1,x,y,125);
  grad.addColorStop(0,'rgba('+rgb.join(',')+',0.19)');
  grad.addColorStop(.55,'rgba('+rgb.join(',')+',0.065)');
  grad.addColorStop(1,'rgba('+rgb.join(',')+',0)');
  g.fillStyle=grad;g.fillRect(0,0,256,256);
 });
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function build(group,original,cutImage,rects,film,settings){
 const T=THREE,unit=Math.max(original.width,original.height),W=original.width/unit*1.75,H=original.height/unit*1.75;
 const count=Math.round(clamp(settings.layers||12,6,24));
 const depth=clamp(settings.depth||1,.05,2);
 const haze=hazeTexture();
 // Very thin atmospheric layers define distance without surrounding cuboids.
 for(let j=0;j<4;j++){
  const z=-.72*depth+j*.36*depth;
  const atmosphere=new T.Mesh(new T.PlaneGeometry(W*2.25,H*2.15),
   new T.MeshBasicMaterial({map:haze,transparent:true,opacity:clamp(settings.colour,0,1)*(.20-j*.026),depthWrite:false,side:T.DoubleSide}));
  atmosphere.position.set((j-1.5)*.085,(j%2-.5)*.075,z);
  atmosphere.userData.floatAtmosphere=true;group.add(atmosphere);
 }
 // Restored v55-style vertical slices, independently selectable from scattered FLOAT.
 if(settings.layout==='slices'){
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,overlap=.32/count;
   const left=Math.max(0,i/count-overlap),right=Math.min(1,(i+1)/count+overlap);
   const r={x:left*original.width,y:0,w:(right-left)*original.width,h:original.height};
   const sheet=new T.Group();
   sheet.position.set(((left+right)/2-.5)*W,Math.sin(i*1.9)*.012*depth,(.5-t)*.88*depth);
   sheet.rotation.y=Math.sin(i*2.3)*.025*depth;
   sheet.rotation.z=Math.sin(i*1.7)*.009*depth;
   sheet.userData.floatSheet=true;group.add(sheet);
   const sw=(right-left)*W;
   if(film==='film'){
    const photo=new T.Mesh(new T.PlaneGeometry(sw,H),new T.MeshBasicMaterial({
     map:imageTexture(original,r),transparent:true,
     opacity:clamp(settings.filmOpacity*(.64+.18*Math.sin(i*1.7)),.05,.98),
     side:T.DoubleSide,depthWrite:false
    }));
    photo.userData.floatPrint=true;sheet.add(photo);
   }
   const glass=new T.Mesh(new T.PlaneGeometry(sw,H),new T.MeshBasicMaterial({
    color:0xb3cbd9,transparent:true,opacity:.045*settings.colour,
    side:T.DoubleSide,depthWrite:false
   }));
   glass.position.z=.002;sheet.add(glass);
  }
  return group.children;
 }
 // Fragment locations remain loosely related to the original photograph.
 // Their depth, rotation, size, and lateral drift differ deterministically.
 const candidates=(rects||[]).filter(r=>r&&r.w>3&&r.h>3&&r.x>=0&&r.y>=0);
 for(let i=0;i<count;i++){
  const sourceRect=candidates.length&&i%3===0?candidates[(i*7)%candidates.length]:null;
  const cell=i%count,cols=Math.max(3,Math.ceil(Math.sqrt(count*1.35)));
  const gx=cell%cols,gy=Math.floor(cell/cols),rows=Math.ceil(count/cols);
  const baseX=(gx+.5+(rnd(i,1)-.5)*.68)/cols;
  const baseY=(gy+.5+(rnd(i,2)-.5)*.68)/rows;
  let r;
  if(sourceRect){
   const x=clamp(sourceRect.x,0,cutImage.width-2),y=clamp(sourceRect.y,0,cutImage.height-2);
   r={x,y,w:Math.min(sourceRect.w,cutImage.width-x),h:Math.min(sourceRect.h,cutImage.height-y)};
  }else{
   const aspect=.65+rnd(i,3)*1.5;
   const rw=clamp(original.width*(.13+rnd(i,4)*.29),8,original.width);
   const rh=clamp(rw/aspect,8,original.height*.47);
   r={x:clamp((baseX-rw/original.width*.5)*original.width,0,original.width-rw),
      y:clamp((baseY-rh/original.height*.5)*original.height,0,original.height-rh),w:rw,h:rh};
  }
  if(r.w<3||r.h<3)continue;
  const tw=r.w/unit*1.75,th=r.h/unit*1.75;
  const nearness=Math.pow(rnd(i,8),.72);
  const z=(-.42+nearness*1.55)*depth*(.55+clamp(settings.parallax,0,1)*1.35);
  const drift=.045+.18*nearness;
  const px=(r.x+r.w/2-original.width/2)/unit*1.75+(rnd(i,5)-.5)*drift*2;
  const py=(original.height/2-r.y-r.h/2)/unit*1.75+(rnd(i,6)-.5)*drift*1.5;
  const sheet=new T.Group();sheet.position.set(px,py,z);
  sheet.rotation.set((rnd(i,9)-.5)*.30,(rnd(i,10)-.5)*.68,(rnd(i,11)-.5)*.25);
  sheet.userData.floatSheet=true;group.add(sheet);
  // Soft contact cues on the floor, attenuated by height and distance.
  if(settings.screen){
   const floorY=-Math.max(.98,original.height/unit*1.13);
   const floorGlow=new T.Mesh(new T.PlaneGeometry(Math.max(.12,tw*1.25),Math.max(.14,th*.62)),
    new T.MeshBasicMaterial({map:haze,transparent:true,opacity:(.055+.095*nearness)*settings.filmOpacity,
      side:T.DoubleSide,depthWrite:false}));
   floorGlow.rotation.x=-Math.PI/2;
   floorGlow.position.set(px,floorY+.018,z-.10);
   floorGlow.userData.floatFloorReflection=true;group.add(floorGlow);
  }

  const opacity=clamp(settings.filmOpacity*(.27+.73*nearness),.04,.98);
  if(film==='film'){
   const imgSource=sourceRect?cutImage:original;
   const tex=imageTexture(imgSource,r);
   const plane=new T.Mesh(new T.PlaneGeometry(tw,th),
    new T.MeshBasicMaterial({map:tex,transparent:true,opacity,side:T.DoubleSide,depthWrite:false}));
   plane.userData.floatPrint=true;sheet.add(plane);
  }
  const glass=new T.Mesh(new T.PlaneGeometry(tw*1.018,th*1.018),
    new T.MeshBasicMaterial({color:0xbccfdf,transparent:true,opacity:clamp(settings.colour,0,1)*(.012+.023*nearness),side:T.DoubleSide,depthWrite:false}));
  glass.position.z=-.002;sheet.add(glass);
  // Atmospheric fade is achieved through opacity, not blurred photos.
  if(i%4===0){
   const shine=new T.Mesh(new T.PlaneGeometry(tw*1.35,th*1.35),
    new T.MeshBasicMaterial({map:haze,transparent:true,opacity:clamp(settings.colour,0,1)*.14,side:T.DoubleSide,depthWrite:false}));
   shine.position.z=-.012;sheet.add(shine);
  }
 }
 return group.children;
}
window.FloatLayers={build};
})();