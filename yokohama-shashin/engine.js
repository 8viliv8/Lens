/* Extract source chroma, soften only the color layer, remap to pigments,
   and reapply over the untouched luminance/detail layer. Browser-local. */
(function(root){
const palettes={sea:[[101,153,170],[156,169,169],[221,188,166]],pearl:[[147,131,169],[182,170,180],[219,200,186]],rose:[[147,135,159],[198,157,154],[221,189,165]],moss:[[114,139,130],[158,169,134],[210,192,155]]};
// Six hue anchors: red, yellow, green, cyan, blue, violet.
const pigments={sea:[[203,151,145],[207,185,145],[144,165,139],[136,180,182],[140,163,192],[176,151,181]],pearl:[[201,158,162],[209,195,166],[160,175,157],[155,185,187],[158,173,204],[185,166,197]],rose:[[213,146,147],[218,185,156],[159,165,139],[157,182,177],[160,167,193],[190,151,178]],moss:[[183,143,129],[197,180,132],[145,164,125],[133,166,158],[141,157,172],[165,149,164]]};
const lum=(r,g,b)=>.2126*r+.7152*g+.0722*b;
function tint(rgb){const l=lum(...rgb);return rgb.map(v=>v-l);}
function blurGrid(a,w,h,r){if(!r)return a;const tmp=new Float32Array(a.length),out=new Float32Array(a.length);for(let c=0;c<3;c++){for(let y=0;y<h;y++){let sum=0;for(let k=-r;k<=r;k++)sum+=a[(y*w+Math.max(0,Math.min(w-1,k)))*3+c];for(let x=0;x<w;x++){tmp[(y*w+x)*3+c]=sum/(2*r+1);sum+=a[(y*w+Math.min(w-1,x+r+1))*3+c]-a[(y*w+Math.max(0,x-r))*3+c];}}for(let x=0;x<w;x++){let sum=0;for(let k=-r;k<=r;k++)sum+=tmp[(Math.max(0,Math.min(h-1,k))*w+x)*3+c];for(let y=0;y<h;y++){out[(y*w+x)*3+c]=sum/(2*r+1);sum+=tmp[(Math.min(h-1,y+r+1)*w+x)*3+c]-tmp[(Math.max(0,y-r)*w+x)*3+c];}}}return out;}
function extract(data,w,h,softness=35){const scale=Math.min(1,256/Math.max(w,h)),gw=Math.max(1,Math.round(w*scale)),gh=Math.max(1,Math.round(h*scale)),grid=new Float32Array(gw*gh*3),counts=new Uint32Array(gw*gh);let chroma=0;for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){if(data[i+3]===0)continue;const r=data[i],g=data[i+1],b=data[i+2],l=lum(r,g,b),p=Math.min(gh-1,Math.floor(y/h*gh))*gw+Math.min(gw-1,Math.floor(x/w*gw));grid[p*3]+=r-l;grid[p*3+1]+=g-l;grid[p*3+2]+=b-l;counts[p]++;chroma+=Math.max(r,g,b)-Math.min(r,g,b);}for(let p=0;p<counts.length;p++)if(counts[p])for(let c=0;c<3;c++)grid[p*3+c]/=counts[p];return {width:gw,height:gh,data:blurGrid(grid,gw,gh,Math.round(softness/100*5)),chroma:chroma/(w*h)};}
function convert(map,preset){const out=new Float32Array(map.data.length),colors=pigments[preset].map(tint);for(let i=0;i<out.length;i+=3){const r=map.data[i],g=map.data[i+1],b=map.data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(d<2)continue;let hue=max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4;hue=(hue+6)%6;const k=Math.floor(hue),f=hue-k,strength=Math.min(1,(d-2)/55);for(let c=0;c<3;c++)out[i+c]=(colors[k][c]*(1-f)+colors[(k+1)%6][c]*f)*strength;}return {width:map.width,height:map.height,data:out};}
function render(data,w,h,opt,mask,map){const out=new Uint8ClampedArray(data.length),pal=palettes[opt.preset].map(tint),amount=opt.color/100,base=opt.auto/100,paper=opt.paper/100,grain=opt.grain/100,useSource=opt.mode!=='tonal';const colors=useSource?convert(map||extract(data,w,h,opt.softness),opt.preset):null;const manualCache=new Map();
for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){const l=lum(data[i],data[i+1],data[i+2]),t=l/255;const wash=.85+.10*Math.sin(x/w*9+y/h*5)+.05*Math.cos(x/w*19-y/h*13);const strength=amount*base*wash*Math.sin(Math.PI*t)*1.7;const m=mask?mask[i+3]/255:0;let mt=[0,0,0];if(m){const key=(mask[i]<<16)|(mask[i+1]<<8)|mask[i+2];mt=manualCache.get(key);if(!mt){mt=tint([mask[i],mask[i+1],mask[i+2]]);manualCache.set(key,mt);}}const noise=grain*(((Math.imul(x+1,374761393)^Math.imul(y+1,668265263))>>>16)/65535*12-6),b=Math.max(0,Math.min(255,l+paper*5*(1-t)+noise));let offsets=[0,0,0];if(colors){const fx=(x+.5)/w*colors.width-.5,fy=(y+.5)/h*colors.height-.5,x0=Math.max(0,Math.min(colors.width-1,Math.floor(fx))),x1=Math.max(0,Math.min(colors.width-1,Math.floor(fx)+1)),y0=Math.max(0,Math.min(colors.height-1,Math.floor(fy))),y1=Math.max(0,Math.min(colors.height-1,Math.floor(fy)+1)),dx=fx-Math.floor(fx),dy=fy-Math.floor(fy);for(let c=0;c<3;c++)offsets[c]=((colors.data[(y0*colors.width+x0)*3+c]*(1-dx)+colors.data[(y0*colors.width+x1)*3+c]*dx)*(1-dy)+(colors.data[(y1*colors.width+x0)*3+c]*(1-dx)+colors.data[(y1*colors.width+x1)*3+c]*dx)*dy)*strength;}else{const k=t<.45?0:1,f=t<.45?t/.45:(t-.45)/.55;for(let c=0;c<3;c++)offsets[c]=(pal[k][c]*(1-f)+pal[k+1][c]*f)*strength*.42;}let bound=1;for(let c=0;c<3;c++){offsets[c]=offsets[c]*(1-m)+mt[c]*m*amount*.7+paper*([5,1,-7][c])*t;if(offsets[c]>0)bound=Math.min(bound,(255-b)/offsets[c]);else if(offsets[c]<0)bound=Math.min(bound,b/-offsets[c]);}for(let c=0;c<3;c++)out[i+c]=b+offsets[c]*bound;out[i+3]=data[i+3];}return out;}
function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n^(n>>>16))>>>0;}
function field(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const n=(a,b)=>hash(a,b)/4294967295;return (n(ix,iy)*(1-fx)+n(ix+1,iy)*fx)*(1-fy)+(n(ix,iy+1)*(1-fx)+n(ix+1,iy+1)*fx)*fy;}
function renderReference(data,w,h,opt,mask,map){
 const base=render(data,w,h,{...opt,mode:'source',paper:0,grain:0},mask,map),out=new Uint8ClampedArray(base.length);
 const paper=(opt.paper||0)/100,aging=(opt.aging||0)/100,edges=(opt.edges||0)/100,grain=(opt.grain||0)/100,amount=opt.color/100*opt.auto/100;
 const blue=tint([103,137,148]),pink=tint([203,150,141]);
 for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){
  const l=lum(data[i],data[i+1],data[i+2]),t=l/255,u=x/w,v=y/h;
  const d=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);
  // Color cues only: this is not a skin/person or object detector.
  const warm=data[i]>data[i+1]&&data[i+1]>=data[i+2]?Math.max(0,Math.min(1,(d-10)/16)):0;
  const neutral=1-Math.min(1,d/60),blueWeight=Math.exp(-Math.pow((t-.43)/.17,2))*neutral*(1-warm)*amount;
  const m=mask?mask[i+3]/255:0;
  const mottled=field(u*18,v*18)-.5,fibre=field(u*170,v*170)-.5;
  const dust=hash(Math.floor(u*1200),Math.floor(v*1200))/4294967295-.5;
  let b=l*(1-.18*paper)+25*paper+(mottled*24+fibre*12)*aging+dust*(grain*25+aging*10);
  const ed=Math.min(u,v,1-u,1-v),wear=(.007+.022*field(u*40,v*40))*edges;
  const rim=edges?Math.max(0,Math.min(1,(wear-ed)/.008)):0;
  for(let c=0;c<3;c++){
   const hue=(base[i+c]-l)+blue[c]*blueWeight*3.5*(1-m)+pink[c]*warm*amount*.28*(1-m);
   let value=b+hue+paper*([24,4,-25][c])*(.3+.7*t);
   if(rim){const tone=[219,195,154][c]+mottled*65;value=value*(1-rim*.8)+tone*rim*.8;}
   out[i+c]=Math.max(0,Math.min(255,value));
  }out[i+3]=data[i+3];
 }return out;
}
function hueCategory(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(!d)return -1;let h=max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4;h=(h+6)%6;return h<.65||h>5.6?0:h<1.3?1:h<2.7?2:h<3.4?3:h<4.7?4:5;}
function extractPalette(data,w,h){
 const sums=Array.from({length:6},()=>[0,0,0]),weights=new Float64Array(6),counts=Array(6).fill(0);let valid=0;
 for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2],l=lum(r,g,b),d=Math.max(r,g,b)-Math.min(r,g,b);if(data[i+3]<128||d<10||l<20||l>240)continue;
  const k=hueCategory(r,g,b),weight=Math.min(1,d/40)*Math.sin(Math.PI*l/255);weights[k]+=weight;counts[k]++;valid++;for(let c=0;c<3;c++)sums[k][c]+=(data[i+c]-l)*weight;
 }
 const colors=sums.map((s,k)=>{if(!weights[k])return [185,185,185];const chroma=s.map(v=>v/weights[k]),range=Math.max(...chroma)-Math.min(...chroma),scale=Math.min(.55,65/range);return chroma.map(v=>Math.round(Math.max(0,Math.min(255,185+v*scale))));});
 return {colors,counts,coverage:valid/(w*h),labels:['赤・薄紅','黄・黄土','緑','青緑','青','紫']};
}
function pigmentMap(map,preset,opt){
 // Classify source hues before softening pigment: six fixed colors, no neutral fill.
 const sets={sea:[[207,163,151],[205,184,143],[150,162,131],[139,162,170],[139,162,170],[177,157,180]],pearl:[[208,170,166],[212,196,170],[166,177,155],[159,176,183],[158,171,190],[188,170,195]],rose:[[213,153,151],[211,181,151],[158,164,140],[155,177,177],[156,169,187],[187,153,172]],moss:[[188,153,134],[198,180,137],[148,164,130],[139,163,153],[145,161,173],[169,151,167]]};
 const colors=(opt.customPalette||sets[preset]).map(tint),out=new Float32Array(map.data.length),cutoff=(opt.threshold??18)*.4;
 for(let i=0;i<out.length;i+=3){const r=map.data[i],g=map.data[i+1],b=map.data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(d<=cutoff)continue;
  let hue=max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4;hue=(hue+6)%6;
  const category=hue<.65||hue>5.6?0:hue<1.3?1:hue<2.7?2:hue<3.4?3:hue<4.7?4:5;
  const confidence=Math.min(1,(d-cutoff)/24);for(let c=0;c<3;c++)out[i+c]=colors[category][c]*confidence;
 }
 return {width:map.width,height:map.height,data:blurGrid(out,map.width,map.height,Math.round((opt.softness||0)/100*5))};
}
function sampleColor(map,x,y,w,h,c){const fx=(x+.5)/w*map.width-.5,fy=(y+.5)/h*map.height-.5,ix=Math.floor(fx),iy=Math.floor(fy),dx=fx-ix,dy=fy-iy;
 const at=(a,b)=>map.data[(Math.max(0,Math.min(map.height-1,b))*map.width+Math.max(0,Math.min(map.width-1,a)))*3+c];
 return (at(ix,iy)*(1-dx)+at(ix+1,iy)*dx)*(1-dy)+(at(ix,iy+1)*(1-dx)+at(ix+1,iy+1)*dx)*dy;
}
function renderPigment(data,w,h,opt,mask,map){const raw=map||extract(data,w,h,0),colors=pigmentMap(raw,opt.preset,opt),out=new Uint8ClampedArray(data.length),amount=opt.color/100,auto=opt.auto/100,paper=opt.paper/100,grain=opt.grain/100,cutoff=(opt.threshold??18)*.4,pooling=(opt.pooling||0)/100;
 for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){const l=lum(data[i],data[i+1],data[i+2]),t=l/255,u=x/w,v=y/h;
  const localChroma=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);
  // Prevent blurred color from leaking onto neutral hair, black cloth or gray surfaces.
  const gate=Math.max(0,Math.min(1,(localChroma-cutoff)/8));
  const strength=amount*auto*Math.sin(Math.PI*t)*1.5*gate*(1+(field(u*17,v*17)-.5)*pooling*.7);
  const dust=hash(Math.floor(u*1200),Math.floor(v*1200))/4294967295-.5;
  const b=Math.max(0,Math.min(255,l*(1-.14*paper)+14*paper+dust*grain*20));
  const m=mask?mask[i+3]/255:0,manual=m?tint([mask[i],mask[i+1],mask[i+2]]):[0,0,0];let bound=1;const delta=[];
  for(let c=0;c<3;c++){delta[c]=sampleColor(colors,x,y,w,h,c)*strength*(1-m)+manual[c]*m*amount+paper*[22,4,-22][c]*(.3+.7*t);if(delta[c]>0)bound=Math.min(bound,(255-b)/delta[c]);else if(delta[c]<0)bound=Math.min(bound,b/-delta[c]);}
  for(let c=0;c<3;c++)out[i+c]=b+delta[c]*bound;out[i+3]=data[i+3];
 }return out;
}
const renderDispatch=(data,w,h,opt,mask,map)=>opt.mode==='pigment'?renderPigment(data,w,h,opt,mask,map):opt.mode==='reference'?renderReference(data,w,h,opt,mask,map):render(data,w,h,opt,mask,map);
root.TintEngine={render:renderDispatch,extract,convert,extractPalette,pigmentMap,palettes,pigments};if(typeof module!=='undefined')module.exports=root.TintEngine;
})(typeof window!=='undefined'?window:globalThis);
