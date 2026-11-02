import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,collection,query,where,onSnapshot} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const db=getFirestore(initializeApp(firebaseConfig));
const $=id=>document.getElementById(id), list=$('jobs-list');let jobs=[];
const favKey='contrata-sul-favoritas-v1';
let favorites=new Set();
try{const raw=JSON.parse(localStorage.getItem(favKey)||'[]');if(Array.isArray(raw))favorites=new Set(raw.filter(x=>typeof x==='string').slice(0,500))}catch{}
function saveFavorites(){try{localStorage.setItem(favKey,JSON.stringify([...favorites]));}catch{} }
function timestamp(job){const t=job.createdAt;return typeof t?.seconds==='number'?t.seconds:typeof t?._seconds==='number'?t._seconds:0}

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function render(){const city=$('job-city'),old=city.value;city.replaceChildren(new Option('Todas as cidades',''));[...new Set(jobs.map(j=>j.location).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>city.add(new Option(x,x)));if([...city.options].some(x=>x.value===old))city.value=old;
const term=$('job-search').value.trim().toLocaleLowerCase('pt-BR'),mode=$('job-mode').value;
let found=jobs.filter(j=>(!term||[j.title,j.company,j.location,j.description].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(term)))&&(!city.value||j.location===city.value)&&(!mode||j.mode===mode)&&(!$('job-only-favorites').checked||favorites.has(j.id)));
const sort=$('job-sort').value;if(sort==='az')found.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'pt-BR'));else if(sort==='company')found.sort((a,b)=>String(a.company||'').localeCompare(String(b.company||''),'pt-BR'));else found.sort((a,b)=>timestamp(b)-timestamp(a));
$('job-favorites-count').textContent=favorites.size+' '+(favorites.size===1?'favorita':'favoritas');
$('jobs-total').textContent=jobs.length;$('jobs-result').textContent=found.length+' '+(found.length===1?'vaga encontrada':'vagas encontradas');list.replaceChildren();
if(!found.length){const empty=el('div','jobs-empty');empty.append(el('h3','',jobs.length?'Nenhuma vaga com esses filtros':'Nenhuma vaga publicada no momento'),el('p','','Confira novamente em breve ou fale com nossa equipe.'));list.append(empty);return}
for(const j of found){const card=el('article','job-card'),head=el('div','job-card-head'),intro=el('div');intro.append(el('h3','',j.title),el('div','job-company',j.company));head.append(intro,el('span','job-pill','Vaga aberta'));const tags=el('div','job-tags');[j.location,j.mode,j.contract,j.salary].filter(Boolean).forEach(v=>tags.append(el('span','',v)));const actions=el('div','job-card-actions'),apply=el('a','job-apply','Candidatar-se ↗');apply.href='candidatar.html?vaga='+encodeURIComponent(j.id);const fav=el('button','job-favorite',favorites.has(j.id)?'★ Salva':'☆ Salvar');fav.type='button';fav.setAttribute('aria-pressed',String(favorites.has(j.id)));fav.setAttribute('aria-label',(favorites.has(j.id)?'Remover dos favoritos: ':'Salvar nos favoritos: ')+j.title);fav.addEventListener('click',()=>{if(favorites.has(j.id))favorites.delete(j.id);else favorites.add(j.id);saveFavorites();render()});actions.append(apply,fav);card.append(head,tags,el('p','job-desc',j.description),actions);list.append(card)} }
for(const id of ['job-search','job-city','job-mode','job-sort','job-only-favorites'])$(id).addEventListener(id==='job-search'?'input':'change',render);
$('job-reset').addEventListener('click',()=>{$('job-search').value='';$('job-city').value='';$('job-mode').value='';$('job-sort').value='recent';$('job-only-favorites').checked=false;render()});
onSnapshot(query(collection(db,'vagas'),where('published','==',true)),snapshot=>{jobs=snapshot.docs.map(d=>({id:d.id,...d.data()}));render()},err=>{$('jobs-result').textContent='Não foi possível carregar as vagas.';list.replaceChildren(el('p','', 'Confira a configuração do Firestore e tente novamente.'));console.error('Firestore:',err.code)});
