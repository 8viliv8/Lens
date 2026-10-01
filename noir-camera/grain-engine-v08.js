/* NOIR CAMERA grain engine v0.8 — isolated so camera/UI code stays untouched. */
window.NOIR_GRAIN_V08=function(r,g,b,l,x,y,seed,vals,mode,noise){
  const gs=Math.max(.5,vals.gs);
  const gx=Math.floor(x/gs), gy=Math.floor(y/gs);
  const fine=noise(gx,gy,seed);
  const medium=noise(Math.floor(x/(gs*2.35)),Math.floor(y/(gs*2.35)),seed+701);
  const coarse=noise(Math.floor(x/(gs*5.4)),Math.floor(y/(gs*5.4)),seed+1709);
  // Film-like density: strongest through mids, still present in shadows/highlights.
  const mid=1-Math.min(1,Math.abs(l-118)/150);
  const density=.48+.52*Math.pow(mid,.7);
  const clusterMix=(medium*.68+coarse*.32)*vals.cl;
  const clumped=fine*(1+clusterMix*.9)+medium*vals.cl*.34+coarse*vals.cl*.18;
  const amp=vals.gr*92*density;
  const mono=clumped*amp;
  r+=mono; g+=mono; b+=mono;
  if(mode==='color'&&vals.ch>0){
    // Partly correlated RGB dye-cloud noise; avoids confetti-like independent pixels.
    const shared=medium*.45+coarse*.25;
    const ca=vals.ch*vals.gr*82*density;
    r+=(shared+noise(gx,gy,seed+17)*.55)*ca;
    g+=(shared+noise(gx,gy,seed+43)*.38)*ca*.72;
    b+=(shared+noise(gx,gy,seed+91)*.62)*ca*1.08;
  }
  return [r,g,b];
};