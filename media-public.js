import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {firebaseConfig} from './firebase-config.js';
import {getFirestore,collection,query,where,onSnapshot} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=getApps()[0]||initializeApp(firebaseConfig),db=getFirestore(app);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function safeUrl(raw){try{const url=new URL(raw);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null}}
const node=(tag,content='',className='')=>{const el=document.createElement(tag);el.textContent=content;el.className=className;return el;};
function createCarousel({track,windowId,dotsId,prevId,nextId,pauseId,indexId,kind}){
 const parent=document.getElementById(track),viewport=document.getElementById(windowId),dots=document.getElementById(dotsId),prev=document.getElementById(prevId),next=document.getElementById(nextId),pause=document.getElementById(pauseId),index=document.getElementById(indexId);
 if(!parent||!viewport)return {render:()=>{}};
 let slides=[],current=0,paused=reduced.matches,hover=false,focused=false,origin=null,interval;
 function go(n){if(!slides.length)return;current=(n+slides.length)%slides.length;parent.style.transform=`translateX(-${current*100}%)`;slides.forEach((el,i)=>{el.tabIndex=i===current?0:-1;el.setAttribute('aria-hidden',String(i!==current));});[...dots.children].forEach((d,i)=>d.setAttribute('aria-current',String(i===current)));if(index)index.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;const progress=document.getElementById('carousel-progress-fill');if(kind==='material'&&progress){progress.style.width=`${100/slides.length}%`;progress.style.transform=`translateX(${current*100}%)`;}}
 function setControls(){const disabled=slides.length<2;prev.disabled=disabled;next.disabled=disabled;pause.disabled=disabled;pause.textContent=paused?'Reproduzir ▶':'Pausar ❚❚';pause.setAttribute('aria-pressed',String(paused));}
 function tick(){clearInterval(interval);if(!paused&&!hover&&!focused&&!document.hidden&&!reduced.matches&&slides.length>1)interval=setInterval(()=>go(current+1),3000)}
 prev.addEventListener('click',()=>{go(current-1);tick()});next.addEventListener('click',()=>{go(current+1);tick()});pause.addEventListener('click',()=>{paused=!paused;setControls();tick()});
 viewport.addEventListener('mouseenter',()=>{hover=true;tick()});viewport.addEventListener('mouseleave',()=>{hover=false;tick()});viewport.addEventListener('focusin',()=>{focused=true;tick()});viewport.addEventListener('focusout',e=>{if(!viewport.contains(e.relatedTarget)){focused=false;tick()}});
 viewport.addEventListener('touchstart',e=>{origin=e.touches[0].clientX},{passive:true});viewport.addEventListener('touchend',e=>{if(origin===null)return;const d=e.changedTouches[0].clientX-origin;if(Math.abs(d)>45){go(current+(d<0?1:-1));tick()}origin=null},{passive:true});
 document.addEventListener('visibilitychange',tick);reduced.addEventListener('change',()=>{paused=reduced.matches;setControls();tick()});
 function render(items){const approved=items.filter(m=>m.type===kind&&safeUrl(m.imageUrl)).sort((a,b)=>(a.order||0)-(b.order||0)||String(a.title).localeCompare(String(b.title),'pt-BR'));
  parent.replaceChildren();dots.replaceChildren();slides=[];current=0;parent.style.transform='translateX(0)';
  if(!approved.length){parent.append(node('p',kind==='banner'?'Nenhuma propaganda publicada no momento.':'Os materiais aparecerão aqui quando a equipe publicar as imagens.','media-empty'));if(index)index.textContent='00 / 00';setControls();tick();return;}
  for(const item of approved){const link=safeUrl(item.linkUrl),card=node(link?'a':'article','',kind==='material'?'portfolio-item':'media-ad-card');if(link){card.href=link;card.target='_blank';card.rel='noopener noreferrer';card.referrerPolicy='no-referrer';}
   const img=node('img');img.src=safeUrl(item.imageUrl);img.alt=item.description||item.title||'Imagem institucional';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{img.style.opacity='0';};
   const meta=node('span');meta.append(node('strong',item.title));if(item.description)meta.append(node('small',item.description));if(link)meta.append(node('b','↗'));
   card.append(img,meta);parent.append(card);slides.push(card);
  }
  for(let i=0;i<slides.length;i++){const button=node('button');button.type='button';button.setAttribute('aria-label',`Mostrar ${kind==='banner'?'propaganda':'material'} ${i+1}`);button.addEventListener('click',()=>{go(i);tick()});dots.append(button);}
  go(0);setControls();tick();
 }
 return {render};
}
const ads=createCarousel({track:'ad-track',windowId:'ad-window',dotsId:'ad-dots',prevId:'ad-prev',nextId:'ad-next',pauseId:'ad-pause',kind:'banner'});
const material=createCarousel({track:'materials-track',windowId:'materials-carousel',dotsId:'carousel-dots',prevId:'carousel-prev',nextId:'carousel-next',pauseId:'carousel-pause',indexId:'carousel-index',kind:'material'});
// Use the inner track for materials; image carousel is not hardcoded anymore.
// Replace the initial control's parent with track element for transform.

try{onSnapshot(query(collection(db,'midia_site'),where('active','==',true)),snap=>{const rows=snap.docs.map(d=>({id:d.id,...d.data()}));ads.render(rows);material.render(rows);},error=>{console.warn('Mídia indisponível:',error.code||error.message);ads.render([]);material.render([])});}catch(error){console.warn('Falha ao iniciar mídia:',error.message);}
