(()=>{
const state={rect:{x:.26,y:.27,w:.45,h:.48},depth:.72,tilt:0,thickness:.02,shadow:.28,floorMode:'a',floorOpacity:1,floorDepth:2.25,floorCrop:1,stageHeight:.07,stageEdge:.018,stageColor:'#05070a',stageShadow:.55};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
function texture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t}
function displayCanvas(source,max=1280){
 const scale=Math.min(1,max/Math.max(source.width,source.height)),c=document.createElement('canvas');c.width=Math.max(2,Math.round(source.width*scale));c.height=Math.max(2,Math.round(source.height*scale));
 const q=c.getContext('2d');q.imageSmoothingEnabled=true;q.imageSmoothingQuality='high';q.filter='contrast(1.13) saturate(1.16) brightness(1.08)';q.drawImage(source,0,0,c.width,c.height);return c;
}
function glowCanvas(source,max=768){
 const scale=Math.min(1,max/Math.max(source.width,source.height)),w=Math.max(2,Math.round(source.width*scale)),h=Math.max(2,Math.round(source.height*scale)),pad=Math.max(12,Math.round(Math.max(w,h)*.045));
 const c=document.createElement('canvas');c.width=w+pad*2;c.height=h+pad*2;const q=c.getContext('2d');
 q.save();q.filter='blur('+Math.max(7,Math.round(Math.max(w,h)*.018))+'px) saturate(1.24) brightness(1.12)';q.globalAlpha=.88;q.drawImage(source,pad,pad,w,h);q.restore();
 q.globalCompositeOperation='destination-in';const fade=q.createRadialGradient(c.width/2,c.height/2,Math.min(w,h)*.3,c.width/2,c.height/2,Math.hypot(c.width,c.height)*.52);fade.addColorStop(0,'rgba(255,255,255,.94)');fade.addColorStop(.82,'rgba(255,255,255,.48)');fade.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=fade;q.fillRect(0,0,c.width,c.height);return c;
}
function floorCanvas(source,crop){
 const c=document.createElement('canvas');c.width=c.height=768;const q=c.getContext('2d'),band=Math.max(1,Math.round(source.height*clamp(crop,.25,1)));
 q.save();q.translate(0,c.height);q.scale(1,-1);q.filter='contrast(1.1) saturate(1.15) brightness(1.06)';q.drawImage(source,0,source.height-band,source.width,band,0,0,c.width,c.height);q.restore();
 const depth=q.createLinearGradient(0,0,0,c.height);depth.addColorStop(0,'rgba(1,3,7,0)');depth.addColorStop(1,'rgba(1,3,7,.08)');q.fillStyle=depth;q.fillRect(0,0,c.width,c.height);return c;
}
function softPatch(source,r){
 const px=Math.max(0,Math.floor(r.x*source.width)),py=Math.max(0,Math.floor(r.y*source.height)),pw=Math.max(2,Math.min(source.width-px,Math.floor(r.w*source.width))),ph=Math.max(2,Math.min(source.height-py,Math.floor(r.h*source.height)));
 const c=document.createElement('canvas');c.width=Math.min(1024,pw);c.height=Math.min(1024,ph);const q=c.getContext('2d');q.drawImage(source,px,py,pw,ph,0,0,c.width,c.height);
 const im=q.getImageData(0,0,c.width,c.height),d=im.data,edge=Math.max(3,Math.min(30,Math.round(Math.min(c.width,c.height)*.065)));
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4+3,t=clamp(Math.min(x,y,c.width-1-x,c.height-1-y)/edge,0,1);d[i]=Math.round(d[i]*t*t*(3-2*t))}q.putImageData(im,0,0);return c;
}
function build(group,source,settings={},second=null){
 const T=THREE,s={...state,...settings},unit=Math.max(source.width,source.height),W=source.width/unit*1.82,H=source.height/unit*1.82;
 const floorY=-H*.5,stageDepth=Math.max(.4,Number(s.floorDepth)||state.floorDepth),stageWidth=W*1.48+clamp(s.stageEdge,0,.2)*2,stageHeight=clamp(s.stageHeight,0,.8),wallZ=-.62;
 const wallGlow=new T.Mesh(new T.PlaneGeometry(W*1.09,H*1.09),new T.MeshBasicMaterial({map:texture(glowCanvas(source)),transparent:true,opacity:.42,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));
 wallGlow.position.set(0,0,wallZ-.018);wallGlow.userData.dioramaWallGlow=true;group.add(wallGlow);
 const wall=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:texture(displayCanvas(source)),side:T.DoubleSide,toneMapped:false}));wall.position.z=wallZ;wall.userData.dioramaBackground=true;group.add(wall);
 const floorSource=s.floorMode==='b'&&second?second:source,floorImage=floorCanvas(floorSource,s.floorCrop);
 const floor=new T.Mesh(new T.PlaneGeometry(stageWidth,stageDepth),new T.MeshBasicMaterial({map:texture(floorImage),transparent:true,opacity:s.floorMode==='off'?0:clamp(s.floorOpacity,.1,1),side:T.DoubleSide,toneMapped:false}));
 floor.rotation.x=-Math.PI/2;floor.position.set(0,floorY,wallZ+stageDepth/2);floor.userData.dioramaPhotoFloor=true;group.add(floor);
 if(s.floorMode!=='off'){
  const color=new T.Color(/^#[0-9a-f]{6}$/i.test(s.stageColor)?s.stageColor:state.stageColor),h=Math.max(.004,stageHeight),edge=clamp(s.stageEdge,0,.2);
  const floorGlow=new T.Mesh(new T.PlaneGeometry(stageWidth*1.055,stageDepth*1.045),new T.MeshBasicMaterial({map:texture(glowCanvas(floorImage,640)),transparent:true,opacity:.28*clamp(s.floorOpacity,.1,1),depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));
  floorGlow.rotation.x=-Math.PI/2;floorGlow.position.set(0,floorY-.007,wallZ+stageDepth/2);floorGlow.userData.dioramaFloorGlow=true;group.add(floorGlow);
  const sides=[.7,.48,.92,.34,.76,.5].map(v=>new T.MeshBasicMaterial({color:color.clone().multiplyScalar(v)})),body=new T.Mesh(new T.BoxGeometry(stageWidth,h,stageDepth+edge),sides);
  body.position.set(0,floorY-h/2-.003,wallZ+(stageDepth+edge)/2);body.userData.dioramaStage=true;group.add(body);
  const darkGround=new T.Mesh(new T.PlaneGeometry(12,10),new T.MeshBasicMaterial({color:0x010204,side:T.DoubleSide,depthWrite:false}));
  darkGround.rotation.x=-Math.PI/2;darkGround.position.set(0,floorY-h-.045,wallZ+3.2);darkGround.userData.dioramaDarkGround=true;group.add(darkGround);
  const ground=new T.Mesh(new T.PlaneGeometry(stageWidth*1.18,stageDepth*1.14),new T.MeshBasicMaterial({map:texture(glowCanvas(floorImage,512)),transparent:true,opacity:.16,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));
  ground.rotation.x=-Math.PI/2;ground.position.set(0,floorY-h-.025,wallZ+stageDepth*.5);ground.userData.dioramaGround=true;group.add(ground);
  const sc=document.createElement('canvas');sc.width=sc.height=256;const q=sc.getContext('2d');q.filter='blur(20px)';q.fillStyle='#000';q.fillRect(34,34,188,188);
  const contact=new T.Mesh(new T.PlaneGeometry(stageWidth*1.34,stageDepth*1.3),new T.MeshBasicMaterial({map:texture(sc),transparent:true,opacity:clamp(s.stageShadow,0,1),depthWrite:false,side:T.DoubleSide}));
  contact.rotation.x=-Math.PI/2;contact.position.set(0,floorY-h-.032,wallZ+stageDepth*.5);contact.userData.dioramaStageShadow=true;group.add(contact);
 }
 const r=s.rect||state.rect,patch=softPatch(source,r),bw=W*r.w,bh=H*r.h,obj=new T.Group();obj.position.set((r.x+r.w/2-.5)*W,floorY+bh/2,wallZ+clamp(s.depth,0,1.8));obj.rotation.y=clamp(s.tilt,-.9,.9);group.add(obj);
 const patchTex=texture(patch),mesh=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:patchTex,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false}));obj.add(mesh);mesh.userData.dioramaCutout=true;
 if(s.thickness>0){const back=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:patchTex,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));back.position.z=-s.thickness;obj.add(back)}
 const reflectTex=texture(patch);reflectTex.wrapT=T.ClampToEdgeWrapping;reflectTex.repeat.y=-1;reflectTex.offset.y=1;
 const reflection=new T.Mesh(new T.PlaneGeometry(bw,bh*.9),new T.MeshBasicMaterial({map:reflectTex,transparent:true,opacity:.28*clamp(s.floorOpacity,.1,1),depthWrite:false,side:T.DoubleSide,toneMapped:false}));
 reflection.rotation.x=-Math.PI/2;reflection.rotation.z=-obj.rotation.y;reflection.position.set(obj.position.x,floorY+.006,obj.position.z+bh*.45);reflection.userData.dioramaReflection=true;group.add(reflection);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sq=shadowCanvas.getContext('2d'),gr=sq.createRadialGradient(64,64,3,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.72)');gr.addColorStop(1,'rgba(0,0,0,0)');sq.fillStyle=gr;sq.fillRect(0,0,128,128);
 const shadow=new T.Mesh(new T.PlaneGeometry(Math.max(.24,bw*1.25),Math.max(.42,bh*.75)),new T.MeshBasicMaterial({map:texture(shadowCanvas),transparent:true,opacity:clamp(s.shadow,0,1),depthWrite:false,side:T.DoubleSide}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(obj.position.x,floorY+.009,obj.position.z+.08);shadow.userData.dioramaFigureShadow=true;group.add(shadow);return group.children;
}
window.DioramaMode={build,state};
})();
