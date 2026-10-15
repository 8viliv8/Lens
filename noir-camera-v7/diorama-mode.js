(()=>{
const state={rect:{x:.26,y:.27,w:.45,h:.48},depth:.85,tilt:0,thickness:.035,shadow:.38,floorMode:'a',floorOpacity:1,floorDepth:2.6,stageHeight:.18,stageEdge:.035,stageColor:'#55545a',stageShadow:.45};
function build(group,source,settings={},second=null){
 const T=THREE,s={...state,...settings},unit=Math.max(source.width,source.height),W=source.width/unit*1.8,H=source.height/unit*1.8;
 const bgTex=new T.CanvasTexture(source);bgTex.colorSpace=T.SRGBColorSpace;
 const bg=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:bgTex,side:T.DoubleSide}));
 bg.position.z=-.62;bg.userData.dioramaBackground=true;group.add(bg);
 const r=s.rect||state.rect,px=Math.max(0,Math.floor(r.x*source.width)),py=Math.max(0,Math.floor(r.y*source.height));
 const pw=Math.max(2,Math.min(source.width-px,Math.floor(r.w*source.width))),ph=Math.max(2,Math.min(source.height-py,Math.floor(r.h*source.height)));
 const patch=document.createElement('canvas');patch.width=Math.min(1024,pw);patch.height=Math.min(1024,ph);
 const ctx=patch.getContext('2d');ctx.drawImage(source,px,py,pw,ph,0,0,patch.width,patch.height);
 // Soft alpha boundary: photographic fragment, not a rectangular stock 3D model.
 const alpha=ctx.getImageData(0,0,patch.width,patch.height),d=alpha.data;
 const edge=Math.max(2,Math.min(16,Math.round(Math.min(patch.width,patch.height)*.055)));
 for(let y=0;y<patch.height;y++)for(let x=0;x<patch.width;x++){
  const k=(y*patch.width+x)*4+3;
  const distance=Math.min(x,y,patch.width-1-x,patch.height-1-y);
  d[k]=Math.round(d[k]*Math.min(1,Math.max(0,distance/edge)));
 }
 ctx.putImageData(alpha,0,0);
 const texture=new T.CanvasTexture(patch);texture.colorSpace=T.SRGBColorSpace;
 const bw=W*r.w,bh=H*r.h;
 const obj=new T.Group();obj.position.set((r.x+r.w/2-.5)*W,(.5-r.y-r.h/2)*H,-.62+s.depth);obj.rotation.y=s.tilt;group.add(obj);
 const mesh=new T.Mesh(new T.PlaneGeometry(bw,bh,10,10),new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide,depthWrite:false}));
 obj.add(mesh);mesh.userData.dioramaCutout=true;
 if(s.thickness>0){const back=new T.Mesh(new T.PlaneGeometry(bw,bh),new T.MeshBasicMaterial({map:texture,transparent:true,opacity:.26,side:T.DoubleSide,depthWrite:false}));back.position.z=-s.thickness;obj.add(back)}
 const floorY=-H*.5;
 // The photo stays at wall-bottom height; the solid stage extends downwards.
 const stageHeight=Math.max(0,Math.min(.8,Number(s.stageHeight)||0));
 const stageEdge=Math.max(0,Math.min(.2,Number(s.stageEdge)||0));
 const stageDepth=Math.max(.4,s.floorDepth),stageWidth=W+stageEdge*2;
 const stageColor=new T.Color(/^#[0-9a-f]{6}$/i.test(s.stageColor)?s.stageColor:'#55545a');
 if(s.floorMode!=='off'){
  const body=new T.Mesh(new T.BoxGeometry(stageWidth,Math.max(.001,stageHeight),stageDepth+stageEdge),
   [ .78,.55,1,.42,.88,.58 ].map(light=>new T.MeshBasicMaterial({color:stageColor.clone().multiplyScalar(light)})));
  body.position.set(0,floorY-Math.max(.001,stageHeight)/2-.002,-.62+(stageDepth+stageEdge)/2);
  body.userData.dioramaStage=true;group.add(body);
  const shade=document.createElement('canvas');shade.width=shade.height=256;
  const sq=shade.getContext('2d');
  // A blurred rectangular contact shadow follows the whole footprint.
  sq.filter='blur(16px)';sq.fillStyle='#000';sq.fillRect(38,38,180,180);
  const contact=new T.Mesh(new T.PlaneGeometry(stageWidth*1.42,(stageDepth+stageEdge)*1.42),
   new T.MeshBasicMaterial({map:new T.CanvasTexture(shade),transparent:true,opacity:Math.max(0,Math.min(1,Number(s.stageShadow)||0)),depthWrite:false,side:T.DoubleSide}));
  contact.rotation.x=-Math.PI/2;
  contact.position.set(0,floorY-stageHeight-.014,-.62+(stageDepth+stageEdge)/2);
  contact.userData.dioramaStageShadow=true;group.add(contact);
 }
 const floorSource=s.floorMode==='b'&&second?second:source;
 const floorTexture=new T.CanvasTexture(floorSource);floorTexture.colorSpace=T.SRGBColorSpace;
 const floor=new T.Mesh(new T.PlaneGeometry(W,Math.max(.4,s.floorDepth)),new T.MeshBasicMaterial({map:floorTexture,transparent:true,opacity:s.floorMode==='off'?0:s.floorOpacity,side:T.DoubleSide,depthWrite:true}));
 floor.rotation.x=-Math.PI/2;floor.position.set(0,floorY,-.62+Math.max(.4,s.floorDepth)/2);floor.userData.dioramaPhotoFloor=true;group.add(floor);
 const sc=document.createElement('canvas');sc.width=sc.height=128;const q=sc.getContext('2d');
 const gr=q.createRadialGradient(64,64,3,64,64,64);gr.addColorStop(0,'rgba(0,0,0,.65)');gr.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=gr;q.fillRect(0,0,128,128);
 const shadow=new T.Mesh(new T.PlaneGeometry(Math.max(.3,bw*1.45),Math.max(.45,s.depth*1.7)),new T.MeshBasicMaterial({map:new T.CanvasTexture(sc),transparent:true,opacity:s.shadow,depthWrite:false,side:T.DoubleSide}));
 shadow.rotation.x=-Math.PI/2;shadow.position.set(obj.position.x,floorY+.012,obj.position.z-.1);group.add(shadow);
 return group.children;
}
window.DioramaMode={build,state};
})();