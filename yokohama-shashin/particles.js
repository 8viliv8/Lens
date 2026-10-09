/* Photo sampling and independent particle geometry. No AI, no object inference. */
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function rand(a,b,s=0){let n=Math.imul(a+1,374761393)^Math.imul(b+1,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
 function grid(w,h,density){const step=Math.max(w,h)/Math.min(Math.max(w,h),clamp(density,12,400));return {cols:Math.max(1,Math.round(w/step)),rows:Math.max(1,Math.round(h/step))};}
 function render(data,w,h,o){
  const {cols,rows}=grid(w,h,o.density),cw=w/cols,ch=h/rows,n=cols*rows,colors=new Float32Array(n*3),counts=new Float32Array(n),layer=new Uint8ClampedArray(w*h*4);
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){const k=Math.min(rows-1,Math.floor(y/ch))*cols+Math.min(cols-1,Math.floor(x/cw)),a=data[i+3]/255;counts[k]+=a;for(let c=0;c<3;c++)colors[k*3+c]+=data[i+c]*a;}
  const size=clamp(o.size,10,180)/100,emission=clamp(o.emission,0,200)/100,jitter=clamp(o.jitter||0,0,100)/100,shape=o.shape||'circle',blend=o.blend||'light',rgb=shape==='rgbdot'||shape==='rgbstripe';
  function stamp(cx,cy,rx,ry,col,kind,seed){
   if(emission===0)return;
   const left=clamp(Math.floor(cx-rx-1),0,w-1),right=clamp(Math.ceil(cx+rx+1),0,w-1),top=clamp(Math.floor(cy-ry-1),0,h-1),bottom=clamp(Math.ceil(cy+ry+1),0,h-1);
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const dx=(x+.5-cx)/rx,dy=(y+.5-cy)/ry,ax=Math.abs(dx),ay=Math.abs(dy);let dist;
    if(kind==='square')dist=Math.max(ax,ay);else if(kind==='diamond')dist=ax+ay;else if(kind==='hex')dist=Math.max(ay,ax*.866+ay*.5);else dist=Math.hypot(dx,dy);
    if(kind==='grain')dist/=1+.18*Math.sin(Math.atan2(dy,dx)*5+seed*11)+.12*Math.cos(Math.atan2(dy,dx)*3+seed*7);
    const aa=.8/Math.max(.4,Math.min(rx,ry));let coverage=clamp((1-dist)/aa+.5,0,1);if(kind==='ring')coverage*=clamp((dist-.57)/aa+.5,0,1);if(!coverage)continue;
    const i=(y*w+x)*4;for(let c=0;c<3;c++){const val=col[c]*emission;if(blend==='ink'){const old=layer[i+c],a=coverage;layer[i+c]=old*(1-a)+val*a;}else layer[i+c]+=val*coverage;}layer[i+3]=blend==='ink'?layer[i+3]*(1-coverage)+coverage*255:Math.max(layer[i+3],Math.round(coverage*255));
   }
  }
  for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){const k=gy*cols+gx;if(!counts[k])continue;const col=[colors[k*3]/counts[k],colors[k*3+1]/counts[k],colors[k*3+2]/counts[k]],seed=rand(gx,gy),cx=(gx+.5+(seed-.5)*jitter*.8)*cw,cy=(gy+.5+(rand(gx,gy,97)-.5)*jitter*.8)*ch,scale=shape==='grain'?.65+seed*.65:1;
   if(rgb){for(let c=0;c<3;c++){const sub=[0,0,0];sub[c]=col[c]*2.2;stamp(cx+(c-1)*cw*.27,cy,cw*size*(shape==='rgbstripe'?.135:.16),ch*size*(shape==='rgbstripe'?.48:.21),sub,shape==='rgbstripe'?'square':'circle',seed);}}
   else stamp(cx,cy,cw*size*.48*scale,ch*size*.48*scale,col,shape,seed);
  }
  let glow=null,gw=0,gh=0;const glowAmount=clamp(o.glow||0,0,100)/100;
  if(glowAmount){const s=Math.min(1,320/Math.max(w,h));gw=Math.max(1,Math.round(w*s));gh=Math.max(1,Math.round(h*s));const a=new Float32Array(gw*gh*3),num=new Uint32Array(gw*gh);
   for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){const k=Math.min(gh-1,Math.floor(y/h*gh))*gw+Math.min(gw-1,Math.floor(x/w*gw));num[k]++;for(let c=0;c<3;c++)a[k*3+c]+=layer[i+c];}for(let k=0;k<num.length;k++)for(let c=0;c<3;c++)a[k*3+c]/=num[k]||1;
   const r=Math.max(1,Math.round(clamp(o.spread||20,1,100)/100*12)),tmp=new Float32Array(a.length);glow=new Float32Array(a.length);
   for(let c=0;c<3;c++){for(let y=0;y<gh;y++){let sum=0;for(let j=-r;j<=r;j++)sum+=a[(y*gw+clamp(j,0,gw-1))*3+c];for(let x=0;x<gw;x++){tmp[(y*gw+x)*3+c]=sum/(2*r+1);sum+=a[(y*gw+clamp(x+r+1,0,gw-1))*3+c]-a[(y*gw+clamp(x-r,0,gw-1))*3+c];}}for(let x=0;x<gw;x++){let sum=0;for(let j=-r;j<=r;j++)sum+=tmp[(clamp(j,0,gh-1)*gw+x)*3+c];for(let y=0;y<gh;y++){glow[(y*gw+x)*3+c]=sum/(2*r+1);sum+=tmp[(clamp(y+r+1,0,gh-1)*gw+x)*3+c]-tmp[(clamp(y-r,0,gh-1)*gw+x)*3+c];}}}
  }
  const bg=o.background==='white'?[248,248,246]:o.background==='paper'?[230,218,196]:[5,7,10],out=new Uint8ClampedArray(layer.length);
  for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i+=4){let gk=glow?(Math.min(gh-1,Math.floor(y/h*gh))*gw+Math.min(gw-1,Math.floor(x/w*gw)))*3:0;for(let c=0;c<3;c++){const b=blend==='ink'?bg[c]*(1-layer[i+3]/255):bg[c];out[i+c]=b+layer[i+c]+(glow?glow[gk+c]*glowAmount*1.5:0);}out[i+3]=255;}
  return {data:out,points:n,elements:rgb?n*3:n,cols,rows};
 }
 root.ParticleEngine={render,grid};if(typeof module!=='undefined')module.exports=root.ParticleEngine;
})(typeof window!=='undefined'?window:globalThis);
