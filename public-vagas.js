import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,collection,query,where,onSnapshot} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const db=getFirestore(initializeApp(firebaseConfig));
const $=id=>document.getElementById(id), list=$('jobs-list');let jobs=[];
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function render(){const city=$('job-city'),old=city.value;city.replaceChildren(new Option('Todas as cidades',''));[...new Set(jobs.map(j=>j.location).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(x=>city.add(new Option(x,x)));if([...city.options].some(x=>x.value===old))city.value=old;
const term=$('job-search').value.trim().toLocaleLowerCase('pt-BR'),mode=$('job-mode').value;
const found=jobs.filter(j=>(!term||[j.title,j.company,j.location,j.description].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(term)))&&(!city.value||j.location===city.value)&&(!mode||j.mode===mode));
$('jobs-total').textContent=jobs.length;$('jobs-result').textContent=found.length+' '+(found.length===1?'vaga encontrada':'vagas encontradas');list.replaceChildren();
if(!found.length){const empty=el('div','jobs-empty');empty.append(el('h3','',jobs.length?'Nenhuma vaga com esses filtros':'Nenhuma vaga publicada no momento'),el('p','','Confira novamente em breve ou fale com nossa equipe.'));list.append(empty);return}
for(const j of found){const card=el('article','job-card'),head=el('div','job-card-head'),intro=el('div');intro.append(el('h3','',j.title),el('div','job-company',j.company));head.append(intro,el('span','job-pill','Vaga aberta'));const tags=el('div','job-tags');[j.location,j.mode,j.contract,j.salary].filter(Boolean).forEach(v=>tags.append(el('span','',v)));const actions=el('div','job-card-actions'),apply=el('a','job-apply','Candidatar-se ↗');apply.href='https://wa.me/5549988354130?text='+encodeURIComponent('Olá! Tenho interesse na vaga de '+j.title+' ('+j.company+', '+j.location+'). Como posso me candidatar?');apply.target='_blank';apply.rel='noopener noreferrer';actions.append(apply);card.append(head,tags,el('p','job-desc',j.description),actions);list.append(card)} }
for(const id of ['job-search','job-city','job-mode'])$(id).addEventListener(id==='job-search'?'input':'change',render);
$('job-reset').addEventListener('click',()=>{$('job-search').value='';$('job-city').value='';$('job-mode').value='';render()});
onSnapshot(query(collection(db,'vagas'),where('published','==',true)),snapshot=>{jobs=snapshot.docs.map(d=>({id:d.id,...d.data()}));render()},err=>{$('jobs-result').textContent='Não foi possível carregar as vagas.';list.replaceChildren(el('p','', 'Confira a configuração do Firestore e tente novamente.'));console.error('Firestore:',err.code)});
