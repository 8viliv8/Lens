(()=>{
function apply(src,seed=1,film='film'){
 const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;
 const q=out.getContext('2d');q.drawImage(src,0,0);
 let state=(seed>>>0)||1;const rnd=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const boxes=[];const n=7+Math.floor(rnd()*6);
 const angle=.25+rnd()*.25,tilt=.10+rnd()*.13,sign=rnd()<.5?-1:1;
 for(let i=0;i<n;i++){
  const bw=w*(.075+rnd()*.22),bh=h*(.055+rnd()*.22);
  const x=rnd()*(w-bw),y=rnd()*(h-bh);
  const depth=(.045+rnd()*.23)*Math.min(w,h);
  const dx=sign*depth*(.65+angle),dy=-depth*(.22+tilt);
  const shift=(rnd()-.5)*Math.min(w,h)*.07;
  const near=[[x+shift,y],[x+bw+shift,y],[x+bw+shift,y+bh],[x+shift,y+bh]];
  const far=near.map(p=>[p[0]+dx,p[1]+dy]);
  boxes.push({near,far,x,y,bw,bh,depth,order:depth+rnd()*w*.15,alpha:.10+rnd()*.13});
 }
 boxes.sort((a,b)=>a.order-b.order);
 function poly(points){q.beginPath();q.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)q.lineTo(points[i][0],points[i][1]);q.closePath()}
 function fill(points,color){poly(points);q.fillStyle=color;q.fill()}
 function stroke(points,color,width){poly(points);q.strokeStyle=color;q.lineWidth=width;q.stroke()}
 for(const b of boxes){
  const {near:a,far:z,x,y,bw,bh,alpha}=b;
  q.save();
  // Rear glass and edges are visible through the translucent front.
  fill(z,'rgba(207,231,236,.045)');
  stroke(z,'rgba(217,238,244,.48)',Math.max(.7,w/1150));
  for(let j=0;j<4;j++){
   const p=[a[j],a[(j+1)%4],z[(j+1)%4],z[j]];
   fill(p,j===1?'rgba(170,205,220,.16)':j===0?'rgba(232,244,248,.075)':'rgba(181,212,225,.09)');
   stroke(p,'rgba(212,231,238,.23)',Math.max(.5,w/1700));
  }
  if(film==='film'){
   q.save();poly(a);q.clip();q.globalAlpha=.24;
   q.drawImage(src,x,y,bw,bh,a[0][0],a[0][1],bw,bh);
   q.restore();
   fill(a,'rgba(214,233,241,.085)');
  }else{
   fill(a,'rgba(217,239,246,.035)');
  }
  stroke(a,'rgba(244,251,253,.72)',Math.max(.85,w/950));
  for(let j=0;j<4;j++){
   q.beginPath();q.moveTo(a[j][0],a[j][1]);q.lineTo(z[j][0],z[j][1]);
   q.strokeStyle='rgba(227,244,249,.55)';q.lineWidth=Math.max(.65,w/1250);q.stroke();
  }
  q.restore();
 }
 return out;
}
window.Glass3DFX={apply};
})();