(()=>{
const state={rect:{x:.26,y:.27,w:.45,h:.48},depth:.72,tilt:0,thickness:.02,shadow:.28,floorMode:'a',floorOpacity:1,floorDepth:2.25,floorCrop:1,screenScale:1,stageHeight:.07,stageEdge:.018,stageColor:'#05070a',stageShadow:.55,room:false,cubeField:false,cubes:12,lineField:false,lineOpacity:.62,motion:false,water:.12,traceMotion:false,neuralMotion:false};
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
function fragmentCanvas(source,i,size=256){
 const c=document.createElement('canvas');c.width=c.height=size;const q=c.getContext('2d'),r=n=>{const x=Math.sin((i+1)*91.73+n*37.19)*43758.5453;return x-Math.floor(x)},side=Math.max(8,Math.min(source.width,source.height)*(.13+r(1)*.23)),x=r(2)*Math.max(1,source.width-side),y=r(3)*Math.max(1,source.height-side);
 q.filter='contrast(1.12) saturate(1.18) brightness(1.07)';q.drawImage(source,x,y,side,side,0,0,size,size);return c;
}
function lineArt(source,size=420){
 const scale=Math.min(1,size/Math.max(source.width,source.height)),w=Math.max(2,Math.round(source.width*scale)),h=Math.max(2,Math.round(source.height*scale)),base=document.createElement('canvas');base.width=w;base.height=h;const b=base.getContext('2d');b.drawImage(source,0,0,w,h);
 const src=b.getImageData(0,0,w,h),out=b.createImageData(w,h),s=src.data,d=out.data,points=[],lum=i=>s[i]*.299+s[i+1]*.587+s[i+2]*.114;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4,gx=-lum(i-w*4-4)-2*lum(i-4)-lum(i+w*4-4)+lum(i-w*4+4)+2*lum(i+4)+lum(i+w*4+4),gy=-lum(i-w*4-4)-2*lum(i-w*4)-lum(i-w*4+4)+lum(i+w*4-4)+2*lum(i+w*4)+lum(i+w*4+4),v=Math.max(0,Math.min(255,(Math.hypot(gx,gy)-24)*2.4));d[i]=174;d[i+1]=232;d[i+2]=255;d[i+3]=v;if(v>110&&(x+y)%5===0)points.push({x:x/w,y:y/h})}b.putImageData(out,0,0);
 const pool=points.filter((_,i)=>i%Math.max(1,Math.ceil(points.length/150))===0).slice(0,150),path=[];if(pool.length){path.push(pool.shift());while(pool.length){const p=path[path.length-1];let best=0,dist=Infinity;for(let i=0;i<pool.length;i++){const dx=p.x-pool[i].x,dy=p.y-pool[i].y,d2=dx*dx+dy*dy;if(d2<dist){dist=d2;best=i}}path.push(pool.splice(best,1)[0])}}
 return {canvas:base,path};
}
function softPatch(source,r){
 const px=Math.max(0,Math.floor(r.x*source.width)),py=Math.max(0,Math.floor(r.y*source.height)),pw=Math.max(2,Math.min(source.width-px,Math.floor(r.w*source.width))),ph=Math.max(2,Math.min(source.height-py,Math.floor(r.h*source.height)));
 const c=document.createElement('canvas');c.width=Math.min(1024,pw);c.height=Math.min(1024,ph);const q=c.getContext('2d');q.drawImage(source,px,py,pw,ph,0,0,c.width,c.height);
 const im=q.getImageData(0,0,c.width,c.height),d=im.data,edge=Math.max(3,Math.min(30,Math.round(Math.min(c.width,c.height)*.065)));
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4+3,t=clamp(Math.min(x,y,c.width-1-x,c.height-1-y)/edge,0,1);d[i]=Math.round(d[i]*t*t*(3-2*t))}q.putImageData(im,0,0);return c;
}
function build(group,source,settings={},second=null){
 const T=THREE,s={...state,...settings},unit=Math.max(source.width,source.height),W=source.width/unit*1.82,H=source.height/unit*1.82,screenScale=clamp(s.screenScale,.45,2.2),wallW=W*screenScale,wallH=H*screenScale;
 const floorY=-H*.5,stageDepth=Math.max(.4,Number(s.floorDepth)||state.floorDepth),stageWidth=W*1.48+clamp(s.stageEdge,0,.2)*2,stageHeight=clamp(s.stageHeight,0,.8),wallZ=-.62,wallY=floorY+wallH/2;
 const wallGlow=new T.Mesh(new T.PlaneGeometry(wallW*1.09,wallH*1.09),new T.MeshBasicMaterial({map:texture(glowCanvas(source)),transparent:true,opacity:.42,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));
 wallGlow.position.set(0,wallY,wallZ-.018);wallGlow.userData.dioramaWallGlow=true;group.add(wallGlow);
 const wallTexture=texture(displayCanvas(source)),wallMaterial=()=>new T.MeshBasicMaterial({map:wallTexture,side:T.DoubleSide,toneMapped:false});
 const wall=new T.Mesh(new T.PlaneGeometry(wallW,wallH),wallMaterial());wall.position.set(0,wallY,wallZ);wall.userData.dioramaBackground=true;group.add(wall);
 const floorSource=s.floorMode==='b'&&second?second:source,floorImage=floorCanvas(floorSource,s.floorCrop);
 if(s.room){
  const left=new T.Mesh(new T.PlaneGeometry(stageDepth,wallH),wallMaterial());left.rotation.y=Math.PI/2;left.position.set(-stageWidth/2,wallY,wallZ+stageDepth/2);left.userData.dioramaSideWall='left';group.add(left);
  const right=new T.Mesh(new T.PlaneGeometry(stageDepth,wallH),wallMaterial());right.rotation.y=-Math.PI/2;right.position.set(stageWidth/2,wallY,wallZ+stageDepth/2);right.userData.dioramaSideWall='right';group.add(right);
 }
 const floorGeometry=new T.PlaneGeometry(stageWidth,stageDepth,s.motion?36:1,s.motion?36:1),floor=new T.Mesh(floorGeometry,new T.MeshBasicMaterial({map:texture(floorImage),transparent:true,opacity:s.floorMode==='off'?0:clamp(s.floorOpacity,.1,1),side:T.DoubleSide,toneMapped:false}));
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
 const rnd=(i,n)=>{const x=Math.sin((i+1)*73.31+n*119.17)*43758.5453;return x-Math.floor(x)},cubeList=[];
 if(s.cubeField){
  const count=Math.max(3,Math.min(30,Math.round(Number(s.cubes)||state.cubes)));
  for(let i=0;i<count;i++){const sz=.075+rnd(i,1)*.17,tex=texture(fragmentCanvas(source,i)),mat=new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.94,side:T.DoubleSide,toneMapped:false}),cube=new T.Mesh(new T.BoxGeometry(sz,sz*(.72+rnd(i,2)*.7),sz*(.72+rnd(i,3)*.7)),mat),x=(rnd(i,4)-.5)*stageWidth*.76,y=floorY+.18+rnd(i,5)*wallH*.78,z=wallZ+.18+rnd(i,6)*stageDepth*.78;
   cube.position.set(x,y,z);cube.rotation.set(rnd(i,7)*1.4,rnd(i,8)*1.7,rnd(i,9)*1.2);cube.userData.dioramaCube={baseY:y,phase:rnd(i,10)*Math.PI*2,speed:.45+rnd(i,11)*.75};cubeList.push(cube);group.add(cube)}
 }
 if(s.lineField){
  for(let i=0;i<7;i++){const art=lineArt(fragmentCanvas(source,80+i,320)),fw=.28+rnd(i,31)*.46,fh=fw*(.7+rnd(i,32)*.52),holder=new T.Group(),plane=new T.Mesh(new T.PlaneGeometry(fw,fh),new T.MeshBasicMaterial({map:texture(art.canvas),transparent:true,opacity:clamp(s.lineOpacity,0,1),depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false})),light=new T.Mesh(new T.SphereGeometry(.018,10,8),new T.MeshBasicMaterial({color:0xe9fbff,transparent:true,opacity:.96,depthWrite:false,blending:T.AdditiveBlending}));
   holder.position.set((rnd(i,33)-.5)*stageWidth*.74,floorY+.25+rnd(i,34)*wallH*.72,wallZ+.16+rnd(i,35)*stageDepth*.78);holder.rotation.set((rnd(i,36)-.5)*.25,(rnd(i,37)-.5)*1.05,(rnd(i,38)-.5)*.22);light.visible=!!s.traceMotion;holder.add(plane);holder.add(light);holder.userData.dioramaLineFragment={path:art.path,light,width:fw,height:fh,baseY:holder.position.y,phase:rnd(i,39)*Math.PI*2,speed:.35+rnd(i,40)*.65};group.add(holder)}
 }
 if(s.neuralMotion&&cubeList.length>1){
  const links=[];for(let i=0;i<cubeList.length;i++){links.push({a:cubeList[i],b:cubeList[(i+1)%cubeList.length],phase:rnd(i,50),speed:.16+rnd(i,51)*.28});if(i%2===0&&cubeList.length>4)links.push({a:cubeList[i],b:cubeList[(i+3)%cubeList.length],phase:rnd(i,52),speed:.12+rnd(i,53)*.22})}
  const positions=new Float32Array(links.length*6),wire=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(positions,3)),new T.LineBasicMaterial({color:0x8ddff6,transparent:true,opacity:.32,depthWrite:false,blending:T.AdditiveBlending}));wire.userData.dioramaNeuralLinks={links};group.add(wire);
  links.slice(0,20).forEach((link,i)=>{const pulse=new T.Mesh(new T.SphereGeometry(.014,9,7),new T.MeshBasicMaterial({color:i%3?0xbaf5ff:0xffffff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));pulse.userData.dioramaSignal={...link,index:i};group.add(pulse)})
 }
 const r=s.rect||state.rect,patch=softPatch(source,r),bw=wallW*r.w,bh=wallH*r.h,obj=new T.Group();obj.position.set((r.x+r.w/2-.5)*wallW,floorY+bh/2,wallZ+clamp(s.depth,0,1.8));obj.rotation.y=clamp(s.tilt,-.9,.9);group.add(obj);
 const patchTex=texture(patch),mesh=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:patchTex,transparent:true,side:T.DoubleSide,depthWrite:false,toneMapped:false}));obj.add(mesh);mesh.userData.dioramaCutout=true;
 if(s.thickness>0){const back=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:patchTex,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}));back.position.z=-s.thickness;obj.add(back)}
 const reflectTex=texture(patch);reflectTex.wrapT=T.ClampToEdgeWrapping;reflectTex.repeat.y=-1;reflectTex.offset.y=1;
 const reflection=new T.Mesh(new T.PlaneGeometry(bw,bh*.9),new T.MeshBasicMaterial({map:reflectTex,transparent:true,opacity:.28*clamp(s.floorOpacity,.1,1),depthWrite:false,side:T.DoubleSide,toneMapped:false}));
 reflection.rotation.x=-Math.PI/2;reflection.rotation.z=-obj.rotation.y;reflection.position.set(obj.position.x,floorY+.006,obj.position.z+bh*.45);reflection.userData.dioramaReflection=true;group.add(reflection);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sq=shadowCanvas.getContext('2d'),gr=sq.createRadialGradient(64,64,3,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.72)');gr.addColorStop(1,'rgba(0,0,0,0)');sq.fillStyle=gr;sq.fillRect(0,0,128,128);
 const shadow=new T.Mesh(new T.PlaneGeometry(Math.max(.24,bw*1.25),Math.max(.42,bh*.75)),new T.MeshBasicMaterial({map:texture(shadowCanvas),transparent:true,opacity:clamp(s.shadow,0,1),depthWrite:false,side:T.DoubleSide}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(obj.position.x,floorY+.009,obj.position.z+.08);shadow.userData.dioramaFigureShadow=true;group.add(shadow);return group.children;
}
function animate(group,time,settings={}){
 const t=time*.001,amp=settings.motion?clamp(settings.water,0,.35):0;group.children.forEach(o=>{const u=o.userData||{};
  if(u.dioramaCube&&settings.motion){const d=u.dioramaCube;o.position.y=d.baseY+Math.sin(t*d.speed+d.phase)*.055;o.rotation.x+=.0018*d.speed;o.rotation.y+=.0025*d.speed}
  if(u.dioramaLineFragment){const d=u.dioramaLineFragment;o.position.y=d.baseY+(settings.motion?Math.sin(t*d.speed+d.phase)*.026:0);d.light.visible=!!settings.traceMotion;if(d.light.visible&&d.path.length){const p=d.path[Math.floor(((t*d.speed+d.phase)%1)*d.path.length)];d.light.position.set((p.x-.5)*d.width,(.5-p.y)*d.height,.022);const pulse=.8+Math.sin(t*9+d.phase)*.28;d.light.scale.setScalar(pulse)}}
  if(u.dioramaPhotoFloor&&o.geometry&&o.geometry.attributes.position&&amp){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*7+t*1.7+y*2.2)*amp*.026+Math.sin(y*5-t*1.25)*amp*.018)}p.needsUpdate=true}
  if(u.dioramaNeuralLinks){const p=o.geometry.attributes.position;u.dioramaNeuralLinks.links.forEach((link,i)=>{p.setXYZ(i*2,link.a.position.x,link.a.position.y,link.a.position.z);p.setXYZ(i*2+1,link.b.position.x,link.b.position.y,link.b.position.z)});p.needsUpdate=true}
  if(u.dioramaSignal){const d=u.dioramaSignal,q=(t*d.speed+d.phase)%1,e=q*q*(3-2*q);o.position.lerpVectors(d.a.position,d.b.position,e);const pulse=.72+Math.sin(q*Math.PI)*.8;o.scale.setScalar(pulse)}
 });
}
window.DioramaMode={build,animate,state};
})();
