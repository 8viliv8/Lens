(()=>{
'use strict';
let source=null,format='jpeg';
const settings={amount:8,color:'#f4f2ec',ratio:'original'};
const ratios={'1:1':1,'3:4':3/4,'4:5':4/5,'16:9':16/9};
function process(canvas){
 const w=canvas.width,h=canvas.height;
 const m=Math.round(Math.min(w,h)*settings.amount/100);
 let W=w+2*m,H=h+2*m;
 const r=ratios[settings.ratio];
 if(r){if(W/H>r)H=Math.ceil(W/r);else W=Math.ceil(H*r)}
 const out=document.createElement('canvas');out.width=W;out.height=H;
 const ctx=out.getContext('2d');ctx.fillStyle=settings.color;ctx.fillRect(0,0,W,H);
 ctx.drawImage(canvas,Math.floor((W-w)/2),Math.floor((H-h)/2));return out;
}
function download(canvas,type){
 const png=type==='png',mime=png?'image/png':'image/jpeg';
 canvas.toBlob(blob=>{
  if(!blob){alert('書き出しに失敗しました');return}
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='NOIR_'+Date.now()+(png?'.png':'.jpg');
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
 },mime,png?undefined:.95);
}
function ensure(){
 let root=document.getElementById('yohakuDialog');if(root)return root;
 root=document.createElement('div');root.id='yohakuDialog';
 root.style.cssText='position:fixed;inset:0;z-index:1000;display:none;overflow:auto;background:#101010f5;color:white;padding:max(24px,env(safe-area-inset-top)) 16px max(32px,env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,sans-serif';
 root.innerHTML=`<div style="max-width:480px;margin:auto">
 <h2 style="font-weight:400;letter-spacing:.2em">YOHAKU <small style="font-size:11px;letter-spacing:0">BEFORE EXPORT</small></h2>
 <canvas id="yohakuPreview" style="display:block;width:100%;max-height:48vh;object-fit:contain;background:#292929"></canvas>
 <label style="display:block;margin:22px 0;font-size:12px;letter-spacing:.1em">AMOUNT <output id="yo-amount">8%</output>
 <input id="yoAmount" type="range" min="0" max="50" step="1" value="8" style="display:block;width:100%;margin-top:12px"></label>
 <div style="margin:20px 0;font-size:12px;letter-spacing:.1em">COLOR
 <div style="display:flex;gap:8px;align-items:center;margin-top:12px">
 <button data-color="#ffffff">WHITE</button><button data-color="#f4f2ec">IVORY</button><button data-color="#000000">BLACK</button>
 <input id="yoColor" type="color" value="#f4f2ec" aria-label="自由な枠色" style="height:38px;width:48px;flex-shrink:0"></div></div>
 <label style="display:block;margin:20px 0;font-size:12px;letter-spacing:.1em">RATIO
 <select id="yoRatio" style="display:block;width:100%;padding:12px;margin-top:10px;background:#222;color:white;border:1px solid #666">
 <option value="original">ORIGINAL</option><option value="1:1">1:1</option><option value="3:4">3:4</option><option value="4:5">4:5</option><option value="16:9">16:9</option></select></label>
 <div style="display:flex;gap:10px;margin-top:24px">
 <button id="yohakuCancel" style="flex:1;padding:15px;background:#222;color:white;border:1px solid #666">CANCEL</button>
 <button id="yohakuSave" style="flex:1;padding:15px;background:white;color:black;border:0">EXPORT ↓</button></div></div>`;
 document.body.appendChild(root);
 function preview(){
  if(!source)return;
  const max=700,k=Math.min(1,max/Math.max(source.width,source.height));
  const temp=document.createElement('canvas');temp.width=Math.max(1,Math.round(source.width*k));temp.height=Math.max(1,Math.round(source.height*k));
  temp.getContext('2d').drawImage(source,0,0,temp.width,temp.height);
  const result=process(temp),view=root.querySelector('#yohakuPreview');
  view.width=result.width;view.height=result.height;view.getContext('2d').drawImage(result,0,0);
 }
 const amount=root.querySelector('#yoAmount'),color=root.querySelector('#yoColor'),ratio=root.querySelector('#yoRatio');
 amount.oninput=()=>{settings.amount=+amount.value;root.querySelector('#yo-amount').textContent=amount.value+'%';preview()};
 color.oninput=()=>{settings.color=color.value;preview()};
 root.querySelectorAll('[data-color]').forEach(b=>{
  b.style.cssText='padding:10px 5px;background:#222;color:white;border:1px solid #666;font-size:10px;flex:1;min-width:0';
  b.onclick=()=>{settings.color=b.dataset.color;color.value=settings.color;preview()};
 });
 ratio.onchange=()=>{settings.ratio=ratio.value;preview()};
 root.querySelector('#yohakuCancel').onclick=()=>root.style.display='none';
 root.querySelector('#yohakuSave').onclick=()=>{root.style.display='none';download(process(source),format)};
 root.refresh=preview;return root;
}
function save(canvas,type='jpeg'){
 if(!canvas)return;source=canvas;format=type;
 const root=ensure();root.style.display='block';root.refresh();
}
window.ExportFX={save};
})();