(()=>{
let renderer=null,scene=null,camera=null,group=null,canvas=null,theta=.55,phi=.18,dist=2.8,active=false,last=null,pointers=new Map(),pinch=0,ready=false,space='dark',shape='box',lastScene=null;
function init(){
 if(!window.THREE)return false;
 if(renderer)return true;
 const T=THREE;canvas=document.createElement('canvas');canvas.id='glassOrbit';canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:none;z-index:2;touch-action:none;background:#101014';
 document.getElementById('stage').appendChild(canvas);
 try{renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x101014,1)}catch(err){console.error(err);canvas.remove();canvas=null;return false}
 scene=new T.Scene();camera=new T.PerspectiveCamera(42,1,.01,100);group=new T.Group();scene.add(group);
 const light=new T.HemisphereLight(0xffffff,0x65778c,2);scene.add(light);
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);pinch=0});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){theta+=(e.clientX-prev[0])*.009;phi=Math.max(-1.35,Math.min(1.35,phi+(e.clientY-prev[1])*.009))}else if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(pinch)dist=Math.max(1.05,Math.min(8,dist*pinch/d));pinch=d}draw()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);pinch=0});
 canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(1.05,Math.min(8,dist*(e.deltaY>0?1.08:.92)));draw()},{passive:false});
 ready=true;return true
}
function sxSafe(i,bw){return Math.sin((i+1)*3.71)*bw*.08}function clear(){if(!group)return;while(group.children.length){const obj=group.children[0];group.remove(obj);obj.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}})}}
function draw(){if(!active||!renderer)return;const rect=document.getElementById('stage').getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.position.set(Math.sin(theta)*Math.cos(phi)*dist,Math.sin(phi)*dist,Math.cos(theta)*Math.cos(phi)*dist);camera.lookAt(0,0,0);camera.updateProjectionMatrix();renderer.render(scene,camera)}
function setSpace(mode){space=mode==='white'?'white':'dark';if(renderer){renderer.setClearColor(space==='white'?0xffffff:0x101014,1);if(canvas)canvas.style.background=space==='white'?'#fff':'#101014';if(group)group.traverse(o=>{if(o.userData&&o.userData.glassEdges)o.material.color.setHex(space==='white'?0x526b78:0xd3e8ef);if(o.userData&&o.userData.glassBody)o.material.color.setHex(space==='white'?0x83a9b7:0xc6e9f2)});draw()}}function setShape(m){shape=['box','sculpt','fold'].includes(m)?m:'box';if(lastScene&&active)show(lastScene.src,lastScene.rects,lastScene.film)}function show(src,rects,film='film'){
 if(!init())return false;
 lastScene={src,rects,film};clear();renderer.setClearColor(space==='white'?0xffffff:0x101014,1);const T=THREE,w=src.width,h=src.height,unit=Math.max(w,h),aspect=w/h;
 // Photograph remains a spatial reference plane behind the volumes.
 const background=new T.Mesh(new T.PlaneGeometry(w/unit*1.75,h/unit*1.75),new T.MeshBasicMaterial({map:new T.CanvasTexture(src),side:T.DoubleSide,transparent:true,opacity:.90,depthWrite:false}));
 background.position.z=-.48;group.add(background);
 const candidates=(rects||[]).slice(0,32);
 for(let i=0;i<candidates.length;i++){
  const r=candidates[i],bw=Math.max(.012,r.w/unit*1.75),bh=Math.max(.012,r.h/unit*1.75),depth=.07+((i*17%11)/11)*.38;
  const x=(r.x+r.w/2-w/2)/unit*1.75,y=(h/2-r.y-r.h/2)/unit*1.75,z=.04+(i%7)*.035;
  const obj=new T.Group();obj.position.set(x,y,z);group.add(obj);
  const geo=new T.BoxGeometry(bw,bh,depth);if(shape==='sculpt'||shape==='fold'){const p=geo.attributes.position;const a=Math.sin((i+1)*12.9898)*43758.5453,rand=n=>{const x=Math.sin((i+1)*79.31+n*113.7+a)*43758.5453;return x-Math.floor(x)};const sx=(rand(1)-.5)*bw*(shape==='fold'?1.1:.65),sy=(rand(2)-.5)*bh*(shape==='fold'?.9:.65),twist=(rand(3)-.5)*(shape==='fold'?1.1:.65);for(let k=0;k<p.count;k++){let xx=p.getX(k),yy=p.getY(k),zz=p.getZ(k);if(zz>0){xx+=sx+yy*twist;yy+=sy-xx*twist*.3}else{xx-=sx*.28;yy-=sy*.28}p.setXYZ(k,xx,yy,zz)}p.needsUpdate=true;geo.computeVertexNormals();obj.position.z+=((rand(4)-.5)*.36);obj.rotation.z=(rand(5)-.5)*.28;obj.rotation.y=(rand(6)-.5)*.34;}
  const glass=new T.Mesh(geo,new T.MeshPhongMaterial({color:space==='white'?0x83a9b7:0xc6e9f2,transparent:true,opacity:shape==='fold'?(film==='clear'?.06:.10):shape==='sculpt'?(film==='clear'?.10:.16):(film==='clear'?.045:.075),side:T.DoubleSide,depthWrite:false,shininess:95}));
  glass.userData.glassBody=true;obj.add(glass);
  const edges=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:space==='white'?0x526b78:0xd3e8ef,transparent:true,opacity:.78,depthTest:true}));edges.userData.glassEdges=true;obj.add(edges);
  if(film==='film'){
   const patch=document.createElement('canvas');patch.width=Math.min(512,Math.max(16,Math.round(r.w)));patch.height=Math.min(512,Math.max(16,Math.round(r.h)));
   const ctx=patch.getContext('2d');ctx.drawImage(src,Math.max(0,r.x),Math.max(0,r.y),Math.max(1,Math.min(r.w,w-Math.max(0,r.x))),Math.max(1,Math.min(r.h,h-Math.max(0,r.y))),0,0,patch.width,patch.height);
   const plane=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:new T.CanvasTexture(patch),transparent:true,opacity:shape==='fold'?.94:shape==='sculpt'?.80:.44,side:T.DoubleSide,depthWrite:false}));
   plane.position.z=depth/2+.001;if(shape==='sculpt'){plane.position.x+=sxSafe(i,bw);plane.rotation.z=Math.sin(i*4.13)*.08}if(shape==='fold'){plane.position.x+=sxSafe(i,bw)*2;plane.rotation.y=Math.sin(i*2.19)*.24;plane.rotation.z=Math.sin(i*3.47)*.12}obj.add(plane);if(shape==='fold'){const tex=plane.material.map;const back=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false}));back.position.z=-depth/2-.002;back.rotation.y=Math.PI;obj.add(back);const sideTex=new T.CanvasTexture(patch);const sideMat=new T.MeshBasicMaterial({map:sideTex,transparent:true,opacity:.58,side:T.DoubleSide,depthWrite:false});const side=new T.Mesh(new T.PlaneGeometry(depth,bh),sideMat);side.rotation.y=Math.PI/2;side.position.x=bw/2;obj.add(side);const inner=new T.Mesh(new T.PlaneGeometry(bw*.88,bh*.86),new T.MeshBasicMaterial({map:new T.CanvasTexture(patch),transparent:true,opacity:.36,side:T.DoubleSide,depthWrite:false}));inner.position.z=0;inner.rotation.y=Math.sin(i*5.1)*.85;inner.rotation.x=Math.cos(i*2.7)*.3;obj.add(inner)}
  }
 }
 active=true;canvas.style.display='block';document.getElementById('c').style.display='none';draw();return true
}
function hide(){active=false;if(canvas)canvas.style.display='none'}
function angle(v){theta=(v-.5)*Math.PI*1.8;draw()}
function snapshot(){if(!active||!renderer)return null;draw();const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;c.getContext('2d').drawImage(canvas,0,0);return c}
window.GlassOrbit={show,hide,angle,setSpace,setShape,snapshot,isActive:()=>active,redraw:draw};
window.addEventListener('resize',()=>{if(active)draw()});
})();