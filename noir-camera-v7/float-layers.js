(()=>{
const palettes=[[.40,.70,.86],[.76,.49,.64],[.93,.68,.36],[.42,.72,.63]];

// Preserve the same image coordinates across neighbouring sheets. Light areas
// transmit the sheets behind them; darker image detail retains more pigment.
function photographTexture(src,r,density){
 const cv=document.createElement('canvas'),scale=Math.min(1,640/r.h);
 cv.width=Math.max(8,Math.round(r.w*scale));cv.height=Math.max(8,Math.round(r.h*scale));
 const ctx=cv.getContext('2d');ctx.drawImage(src,r.x,r.y,r.w,r.h,0,0,cv.width,cv.height);
 const image=ctx.getImageData(0,0,cv.width,cv.height),d=image.data;
 for(let i=0;i<d.length;i+=4){
  const l=(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/255;
  const chroma=(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]))/255;
  d[i+3]=Math.round(d[i+3]*Math.min(.94,(.36+(1-l)*.48+chroma*.18)*density));
 }
 ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function opticalMaterial(tint,opacity){
 return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{tint:{value:new THREE.Vector3(...tint)},opacity:{value:opacity}},
  vertexShader:`varying vec2 filmUV;varying vec3 filmNormal;varying vec3 filmView;
   void main(){filmUV=uv;vec4 p=modelViewMatrix*vec4(position,1.0);filmNormal=normalize(normalMatrix*normal);filmView=-p.xyz;gl_Position=projectionMatrix*p;}`,
  fragmentShader:`uniform vec3 tint;uniform float opacity;varying vec2 filmUV;varying vec3 filmNormal;varying vec3 filmView;
   void main(){float grazing=1.0-abs(dot(normalize(filmNormal),normalize(filmView)));
    vec3 colour=mix(tint,tint.zxy,smoothstep(.1,.9,grazing)*.52);
    float edge=1.0-smoothstep(0.0,.045,min(min(filmUV.x,1.0-filmUV.x),min(filmUV.y,1.0-filmUV.y)));
    float sheen=.5+.5*sin(filmUV.y*3.14159+grazing*4.0);
    gl_FragColor=vec4(colour,opacity*(.17+edge*.68+grazing*.38+sheen*.12));}`
 });
}

function build(group,original,cutImage,rects,film,settings){
 const T=THREE,unit=Math.max(original.width,original.height),W=original.width/unit*1.75,H=original.height/unit*1.75;
 const layers=[],count=Math.round(settings.layers),depth=settings.depth;
 const mesh=(width,height,material)=>new T.Mesh(new T.PlaneGeometry(width,height),material);
 const light=document.createElement('canvas');light.width=256;light.height=192;const lightCtx=light.getContext('2d');
 for(let i=0;i<palettes.length;i++){
  const [r,g,b]=palettes[i].map(v=>Math.round(v*255)),x=32+i*64;
  const glow=lightCtx.createRadialGradient(x,96,8,x,96,95);
  glow.addColorStop(0,`rgba(${r},${g},${b},.22)`);glow.addColorStop(1,`rgba(${r},${g},${b},0)`);
  lightCtx.fillStyle=glow;lightCtx.fillRect(0,0,256,192);
 }
 const lightTexture=new T.CanvasTexture(light);lightTexture.colorSpace=T.SRGBColorSpace;
 const colourLight=mesh(W*1.55,H*1.5,new T.MeshBasicMaterial({map:lightTexture,transparent:true,opacity:settings.colour,side:T.DoubleSide,depthWrite:false}));
 colourLight.position.z=-.51*depth-.12;colourLight.userData.floatLight=true;group.add(colourLight);
 for(let i=0;i<count;i++){
  const t=(i+.5)/count,overlap=.32/count;
  const left=Math.max(0,i/count-overlap),right=Math.min(1,(i+1)/count+overlap);
  const r={x:left*original.width,y:0,w:(right-left)*original.width,h:original.height};
  const sheet=new T.Group();sheet.position.set(((left+right)/2-.5)*W,Math.sin(i*1.9)*.012*depth,(.5-t)*.88*depth);
  // Parallel membranes open into a stepped ribbon when viewed obliquely.
  sheet.rotation.y=Math.sin(i*2.3)*.025*depth;sheet.rotation.z=Math.sin(i*1.7)*.009*depth;
  sheet.userData.floatSheet=true;group.add(sheet);layers.push(sheet);
  const width=(right-left)*W;
  if(film==='film'){
   const print=mesh(width,H,new T.MeshBasicMaterial({map:photographTexture(original,r,1),transparent:true,opacity:settings.filmOpacity,side:T.DoubleSide,depthWrite:false}));
   print.userData.floatPrint=true;sheet.add(print);
  }
  const membrane=mesh(width,H,opticalMaterial(palettes[i%palettes.length],settings.colour));
  membrane.position.z=.002;sheet.add(membrane);
  const outline=new T.PlaneGeometry(width,H),edges=new T.EdgesGeometry(outline);outline.dispose();
  const border=new T.LineSegments(edges,new T.LineBasicMaterial({color:new T.Color(...palettes[i%palettes.length]),transparent:true,opacity:.08+settings.colour*.13,depthWrite:false}));
  border.position.z=.003;sheet.add(border);
 }
 // A few CUT-UP fragments retain the existing A/B mix and reshuffle character.
 // Their position sits within the photographic ribbon rather than in free space.
 if(film==='film')for(let i=0;i<Math.min(5,(rects||[]).length);i++){
  const q=rects[i],x=Math.max(0,q.x),y=Math.max(0,q.y),w=Math.min(q.w,cutImage.width-x),h=Math.min(q.h,cutImage.height-y);
  if(w<2||h<2)continue;
  const cutUnit=Math.max(cutImage.width,cutImage.height);
  const fragment=mesh(w/cutUnit*1.75,h/cutUnit*1.75,new T.MeshBasicMaterial({map:photographTexture(cutImage,{x,y,w,h},.8),transparent:true,opacity:settings.filmOpacity*.45,side:T.DoubleSide,depthWrite:false}));
  fragment.position.set((x+w/2-cutImage.width/2)/cutUnit*1.75,(cutImage.height/2-y-h/2)/cutUnit*1.75,.06+((i%3)-1)*.18*depth);
  fragment.userData.floatCut=true;group.add(fragment);
 }
 return layers;
}
window.FloatLayers={build};
})();
