import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {firebaseConfig} from './firebase-config.js';
import {getAuth,onAuthStateChanged,reauthenticateWithCredential,EmailAuthProvider} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,addDoc,updateDoc,setDoc,writeBatch,Timestamp,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=getApps()[0]||initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app),$=id=>document.getElementById(id);
const collections={people:'crm_vinculos',requests:'crm_solicitacoes',contacts:'crm_contatos',tasks:'crm_tarefas',notes:'crm_atividades'};
const state={relationships:[],companies:[],candidates:[],jobs:[],people:[],requests:[],contacts:[],tasks:[],notes:[]};
let allowed=false,subs=[],selected='';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const el=(tag,value='',className='')=>{const n=document.createElement(tag);n.textContent=value;n.className=className;return n;};
const feedback=text=>{$('crm-feedback-message').textContent=text;};
const safeDate=value=>{if(!value)return '—';try{const d=value.toDate?.()||new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR'):'—';}catch{return '—';}};
const selectedCompany=()=>state.companies.find(c=>c.id===selected);
const filtered=type=>state[type].filter(row=>row.companyId===selected);
const allowedStatus=['Em análise','Entrevista','Aprovado','Contratado','Desligado','Encerrado'];
function clear(){for(const unsubscribe of subs)unsubscribe();subs=[];allowed=false;selected='';Object.keys(state).forEach(k=>state[k]=[]);$('crm-company').replaceChildren(new Option('Selecione uma empresa cadastrada',''));$('crm-company-results').replaceChildren();$('crm-company-results').hidden=true;$('crm-company-count').textContent='';render();}
function listen(key,path){subs.push(onSnapshot(collection(db,path),snap=>{state[key]=snap.docs.map(d=>({id:d.id,...d.data()}));if(key==='companies')fillCompanies();if(key==='candidates')fillCandidates();render();},error=>feedback(`Falha ao carregar ${path}: ${error.code||error.message}`)));}
onAuthStateChanged(auth,async user=>{clear();if(!user)return;try{const record=await getDoc(doc(db,'admins',user.uid));if(!record.exists()||record.data().active!==true)return;allowed=true;listen('companies','empresas');listen('relationships','crm_relacionamentos');listen('candidates','candidaturas');listen('jobs','vagas');for(const [key,path] of Object.entries(collections))listen(key,path);}catch(error){feedback('Não foi possível verificar o acesso: '+(error.code||error.message));}});
let searchResultsClosed=false;
const matchingCompanies=()=>{const term=norm($('crm-company-filter').value.trim());return [...state.companies].filter(c=>norm([c.name,c.tradeName,c.cnpj,c.city,c.state].join(' ')).includes(term)).sort((a,b)=>String(a.tradeName||a.name).localeCompare(String(b.tradeName||b.name),'pt-BR'));};
function openCompany(id){
 const company=state.companies.find(c=>c.id===id);if(!company)return;
 selected=id;searchResultsClosed=true;$('crm-company-filter').value=company.tradeName||company.name;
 fillCompanies();$('crm-company').value=id;
 for(const form of document.querySelectorAll('#crm-details .crm-form')){delete form.dataset.editId;form.querySelector('button[type=submit]')?.removeAttribute('data-editing');}
 render();document.dispatchEvent(new CustomEvent('crm-company-change',{detail:{companyId:selected}}));
 $('crm-details').scrollIntoView({behavior:'smooth',block:'start'});
}
function fillCompanies(){
 const picker=$('crm-company'),term=norm($('crm-company-filter').value.trim()),matches=matchingCompanies(),prior=selected;
 picker.replaceChildren(new Option('Selecione uma empresa cadastrada',''));
 for(const c of matches.slice(0,150))picker.add(new Option(`${c.tradeName||c.name} · ${c.city||'cidade não informada'}`,c.id));
 // Ao selecionar uma empresa, o campo de pesquisa continua mostrando a opção escolhida.
 if(prior&&matches.some(c=>c.id===prior))picker.value=prior;
 const results=$('crm-company-results'),count=$('crm-company-count');results.replaceChildren();
 if(!allowed){count.textContent='Entre como administrador para pesquisar.';results.hidden=true;return;}
 count.textContent=term?`${matches.length} ${matches.length===1?'empresa encontrada':'empresas encontradas'}`:`${state.companies.length} empresas cadastradas`;
 results.hidden=!term||searchResultsClosed;
 if(results.hidden)return;
 if(!matches.length){results.append(el('p','Nenhuma empresa corresponde à pesquisa. Confira o nome ou cadastre a empresa primeiro.','crm-company-no-results'));return;}
 for(const c of matches.slice(0,12)){
  const b=el('button','','crm-company-result');b.type='button';
  b.append(el('strong',c.tradeName||c.name||'Empresa'),el('small',[c.name!==c.tradeName?c.name:'',c.city,c.state,c.cnpj].filter(Boolean).join(' · ')));
  b.addEventListener('click',()=>openCompany(c.id));results.append(b);
 }
 if(matches.length>12)results.append(el('p','Exibindo 12 empresas. Refine sua pesquisa.','crm-company-no-results'));
}
function fillCandidates(){const picker=$('crm-person-candidate'),term=norm($('crm-person-candidate-search')?.value),previous=picker.value;
 picker.replaceChildren(new Option('Selecione um candidato',''));
 for(const c of [...state.candidates].filter(c=>norm([c.name,c.email,c.phone,c.jobTitle,c.stage].join(' ')).includes(term)||c.id===previous).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR')).slice(0,150))picker.add(new Option(`${c.name||'Sem nome'} — ${c.jobTitle||c.phone||c.email||'Sem vaga'}`,c.id));
 picker.value=previous||'';
}
$('crm-person-candidate-search').addEventListener('input',fillCandidates);

$('crm-company').addEventListener('change',event=>{if(event.target.value){openCompany(event.target.value);}else{selected='';render();document.dispatchEvent(new CustomEvent('crm-company-change',{detail:{companyId:''}}));}});
$('crm-company-filter').addEventListener('input',()=>{searchResultsClosed=false;if(selected){selected='';render();document.dispatchEvent(new CustomEvent('crm-company-change',{detail:{companyId:''}}));}fillCompanies();});
$('crm-company-filter').addEventListener('keydown',event=>{
 if(event.key==='Escape'){searchResultsClosed=true;fillCompanies();return;}
 if(event.key==='ArrowDown'){const first=$('crm-company-results').querySelector('button');if(first){event.preventDefault();first.focus();}}
 if(event.key==='Enter'){const first=matchingCompanies()[0];if(first){event.preventDefault();openCompany(first.id);}}
});
// Vincula automaticamente a vaga pelo nome da empresa para exibição, sem inferir contratação.
function jobsForCompany(company){return state.jobs.filter(j=>j.companyId===company.id||(j.cnpj&&company.cnpj&&j.cnpj===company.cnpj)||norm(j.company)===norm(company.name)||Boolean(company.tradeName&&norm(j.company)===norm(company.tradeName)));}
function candidatesForCompany(company){const ids=new Set(jobsForCompany(company).map(j=>j.id));return state.candidates.filter(c=>ids.has(c.jobId));}
function render(){const company=selectedCompany();$('crm-details').hidden=!company;$('crm-empty').hidden=!!company;if(!company)return;const relationship=state.relationships.find(r=>r.id===selected);if(!document.activeElement?.closest('#crm-relationship-form')){$('crm-relationship-status').value=relationship?.status||'Prospecto';$('crm-relationship-owner').value=relationship?.owner||'';}
const people=filtered('people'),requests=filtered('requests'),tasks=filtered('tasks');const linked=candidatesForCompany(company);const hired=people.filter(p=>p.status==='Contratado');const interviewing=people.filter(p=>['Em análise','Entrevista','Aprovado'].includes(p.status));
const metrics=[['Vagas',jobsForCompany(company).length],['Candidaturas vinculadas',linked.length],['Contratados confirmados',hired.length],['Em processo',interviewing.length],['Solicitações abertas',requests.filter(r=>r.status!=='Concluída').length],['Tarefas pendentes',tasks.filter(t=>!t.done).length]];
const root=$('crm-metrics');root.replaceChildren();for(const [name,value] of metrics){const card=el('div','','crm-metric');card.append(el('span',name),el('strong',String(value)));root.append(card);}renderList('people');renderList('requests');renderList('contacts');renderList('tasks');renderList('notes');}
const fields={people:['candidateName','role','status','hiredAt','note'],requests:['role','qty','due','priority','note','status'],contacts:['name','role','email','phone'],tasks:['title','owner','due','done'],notes:['type','text']};
const labelFor={people:r=>`${r.candidateName} · ${r.role} · ${r.status}${r.hiredAt?' · Admissão: '+r.hiredAt:''}`,requests:r=>`${r.role} · ${r.qty} vaga(s) · ${r.status||'Aberta'}${r.due?' · Prazo: '+r.due:''}`,contacts:r=>`${r.name} · ${r.role||'Contato'} · ${r.email||''} · ${r.phone||''}`,tasks:r=>`${r.done?'Concluída':'Pendente'} · ${r.title}${r.due?' · '+r.due:''}`,notes:r=>`${r.type} · ${r.text} · ${safeDate(r.createdAt)}`};
function renderList(type){const root=$(`crm-${type}-list`);root.replaceChildren();let rows=filtered(type);const searchInput=$(`crm-${type}-search`);
if(searchInput)rows=rows.filter(row=>norm([labelFor[type](row),row.note,row.due,row.status,row.phone,row.email,row.owner,row.priority].join(' ')).includes(norm(searchInput.value)));
if(type==='people'){const term=norm($('crm-people-search').value);rows=rows.filter(r=>norm([r.candidateName,r.role,r.status,state.candidates.find(c=>c.id===r.candidateId)?.phone].join(' ')).includes(term));}
rows=[...rows].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));for(const row of rows.slice(0,150)){const item=el('article','','crm-entry');item.append(el('p',labelFor[type](row)));if(row.note&&type!=='notes')item.append(el('small',row.note));const actions=el('div','','crm-entry-actions');
if(type!=='notes'){
 const edit=el('button','Editar','secondary');edit.type='button';edit.addEventListener('click',()=>{
  const form=$(`crm-${type}-form`);form.dataset.editId=row.id;
  for(const [key,input] of Object.entries({people:{candidateId:'crm-person-candidate',role:'crm-person-role',status:'crm-person-status',hiredAt:'crm-person-date',note:'crm-person-note'},requests:{role:'crm-request-role',qty:'crm-request-qty',due:'crm-request-due',priority:'crm-request-priority',note:'crm-request-note'},contacts:{name:'crm-contact-name',role:'crm-contact-role',email:'crm-contact-email',phone:'crm-contact-phone'},tasks:{title:'crm-task-title',owner:'crm-task-owner',due:'crm-task-due'}}[type]||{}))$(input).value=String(row[key]??'');
  if(type==='people'){const c=state.candidates.find(c=>c.id===row.candidateId);$('crm-person-candidate-search').value=c?.name||row.candidateName||'';fillCandidates();$('crm-person-candidate').value=row.candidateId;}
  form.querySelector('button[type=submit]').textContent='Salvar alterações';form.scrollIntoView({block:'center',behavior:'smooth'});
 });actions.append(edit);
}

if(type==='people'){const candidate=state.candidates.find(c=>c.id===row.candidateId);const phone=String(candidate?.phone||'').replace(/\D/g,'');if(phone.length>=10&&phone.length<=13){const tel=el('a','Ligar para candidato','suite-link');tel.href='tel:+'+(phone.length<=11?'55':'')+phone;actions.append(tel);const wa=el('a','WhatsApp','suite-link');wa.href='https://wa.me/'+(phone.length<=11?'55':'')+phone;wa.target='_blank';wa.rel='noopener noreferrer';actions.append(wa);}}
if(type==='people'){for(const status of allowedStatus){if(row.status===status)continue;const button=el('button',status,'secondary');button.type='button';button.addEventListener('click',()=>change(type,row,{status}));actions.append(button);}}
if(type==='requests'){for(const status of ['Aberta','Em andamento','Concluída']){if(row.status===status)continue;const button=el('button',status,'secondary');button.type='button';button.addEventListener('click',()=>change(type,row,{status}));actions.append(button);}}
if(type==='contacts'&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email||'')){const link=el('a','Escrever e-mail','suite-link');link.href='mailto:'+encodeURIComponent(row.email);link.rel='noopener';actions.append(link);}
if(type==='contacts'&&row.phone){const digits=String(row.phone).replace(/\D/g,'');if(digits.length>=10&&digits.length<=13){const action=el('a','Ligar','suite-link');action.href='tel:+'+(digits.length<=11?'55':'')+digits;actions.append(action);const whatsapp=el('a','WhatsApp','suite-link');whatsapp.href='https://wa.me/'+(digits.length<=11?'55':'')+digits;whatsapp.target='_blank';whatsapp.rel='noopener noreferrer';actions.append(whatsapp);}}
if(type==='tasks'){const button=el('button',row.done?'Reabrir':'Concluir','secondary');button.type='button';button.addEventListener('click',()=>change(type,row,{done:!row.done}));actions.append(button);}
const erase=el('button','Excluir','danger');erase.type='button';erase.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('admin-request-delete',{detail:{collection:collections[type],id:row.id,label:labelFor[type](row)}})));actions.append(erase);if(actions.childElementCount)item.append(actions);root.append(item);}if(!rows.length)root.append(el('p','Nenhum registro encontrado.','crm-hint'));if(rows.length>150)root.append(el('p','Exibindo 150 registros.','crm-hint'));}
async function change(type,row,patch){if(!allowed||!selected||row.companyId!==selected)return;
 if(type==='people'&&patch.status==='Contratado'&&!row.hiredAt){
  const hired=prompt('Informe a data de contratação confirmada (AAAA-MM-DD):',new Date().toISOString().slice(0,10));
  if(!hired)return;if(!/^\d{4}-\d{2}-\d{2}$/.test(hired)){feedback('Data inválida.');return;}patch.hiredAt=hired;
 }
 try{await updateDoc(doc(db,collections[type],row.id),{...patch,updatedAt:serverTimestamp()});feedback('Situação atualizada.');}catch(error){feedback('Erro ao atualizar: '+(error.code||error.message));}}
$('crm-people-search').addEventListener('input',()=>renderList('people'));
const formData={people:()=>{const id=$('crm-person-candidate').value,c=state.candidates.find(c=>c.id===id);if(!c)throw Error('Selecione um candidato cadastrado.');const status=$('crm-person-status').value,hiredAt=$('crm-person-date').value;if(status==='Contratado'&&!hiredAt)throw Error('Informe a data de admissão para confirmar a contratação.');return {candidateId:id,candidateName:c.name||'',role:$('crm-person-role').value.trim(),status,hiredAt,note:$('crm-person-note').value.trim()};},requests:()=>({role:$('crm-request-role').value.trim(),qty:Number($('crm-request-qty').value),due:$('crm-request-due').value,priority:$('crm-request-priority').value,note:$('crm-request-note').value.trim(),status:'Aberta'}),contacts:()=>({name:$('crm-contact-name').value.trim(),role:$('crm-contact-role').value.trim(),email:$('crm-contact-email').value.trim(),phone:$('crm-contact-phone').value.trim()}),tasks:()=>({title:$('crm-task-title').value.trim(),owner:$('crm-task-owner').value.trim(),due:$('crm-task-due').value,done:false}),notes:()=>({type:$('crm-note-type').value,text:$('crm-note-text').value.trim()})};
for(const type of Object.keys(collections)){$(`crm-${type}-form`).addEventListener('submit',async event=>{event.preventDefault();if(!allowed||!selectedCompany())return;const button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;try{const data=formData[type]();const editId=event.currentTarget.dataset.editId;
 if(editId){const old=state[type].find(x=>x.id===editId&&x.companyId===selected);if(!old)throw Error('Registro selecionado não pertence a esta empresa.');if(type==='requests')data.status=old.status||'Aberta';if(type==='tasks')data.done=Boolean(old.done);await updateDoc(doc(db,collections[type],editId),{...data,updatedAt:serverTimestamp()});}
 else if(type==='people'){const duplicate=state.people.find(x=>x.companyId===selected&&x.candidateId===data.candidateId);if(duplicate)throw Error('Este candidato já está vinculado à empresa. Use Editar para atualizar o vínculo.');await addDoc(collection(db,collections[type]),{...data,companyId:selected,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});}
 else await addDoc(collection(db,collections[type]),{...data,companyId:selected,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
 event.currentTarget.reset();delete event.currentTarget.dataset.editId;event.currentTarget.querySelector('button[type=submit]').textContent=type==='people'?'Registrar vínculo':type==='requests'?'Criar solicitação':type==='contacts'?'Adicionar contato':type==='tasks'?'Adicionar tarefa':'Registrar atividade';feedback('Registro salvo com sucesso.');}catch(error){feedback('Não foi possível salvar: '+(error.code||error.message));}finally{button.disabled=false;}});}
for(const button of document.querySelectorAll('[data-crm-tab]'))button.addEventListener('click',()=>{const active=button.dataset.crmTab;for(const tab of document.querySelectorAll('[data-crm-tab]'))tab.classList.toggle('active',tab===button);for(const pane of document.querySelectorAll('#crm-details .crm-pane'))pane.hidden=pane.id!==`crm-${active}`;});
function csvCell(value){const text=String(value??'');return '"'+( /^[=+@\-\t\r]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"';}
$('crm-export').addEventListener('click',()=>{if(!allowed||!selectedCompany()){feedback('Selecione uma empresa para exportar.');return;}const lines=[['Tipo','Nome ou descrição','Situação','Data','Observação']];for(const p of filtered('people'))lines.push(['Profissional',p.candidateName,p.status,p.hiredAt,p.role]);for(const r of filtered('requests'))lines.push(['Solicitação',r.role,r.status,r.due,r.note]);for(const c of filtered('contacts'))lines.push(['Contato',c.name,c.role,'',c.email]);for(const t of filtered('tasks'))lines.push(['Tarefa',t.title,t.done?'Concluída':'Pendente',t.due,t.owner]);for(const n of filtered('notes'))lines.push(['Atividade',n.type,'',safeDate(n.createdAt),n.text]);const blob=new Blob(['\ufeff'+lines.map(row=>row.map(csvCell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='contrata-sul-relatorio-empresa-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);feedback('Relatório exportado. Guarde o arquivo em local privado.');});

$('crm-relationship-form').addEventListener('submit',async event=>{event.preventDefault();if(!allowed||!selectedCompany())return;const button=event.currentTarget.querySelector('button');button.disabled=true;try{await setDoc(doc(db,'crm_relacionamentos',selected),{status:$('crm-relationship-status').value,owner:$('crm-relationship-owner').value.trim(),updatedAt:serverTimestamp()});feedback('Relacionamento comercial atualizado.');}catch(error){feedback('Erro ao salvar relacionamento: '+(error.code||error.message));}finally{button.disabled=false;}});

function downloadJson(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('crm-backup').addEventListener('click',()=>{if(!allowed)return;const data={format:'contrata-sul-crm',version:1,projectId:'contrata-sul',exportedAt:new Date().toISOString(),collections:{}};for(const [key,path] of Object.entries(collections))data.collections[path]=state[key].map(row=>({...row,createdAt:row.createdAt?.toDate?.().toISOString()||null,updatedAt:row.updatedAt?.toDate?.().toISOString()||null}));data.collections.crm_relacionamentos=state.relationships.map(row=>({...row,updatedAt:row.updatedAt?.toDate?.().toISOString()||null}));downloadJson(data,'contrata-sul-crm-'+new Date().toISOString().slice(0,10)+'.json');feedback('Cópia CRM exportada dos dados carregados. Guarde em local privado; contém dados pessoais.');});
$('crm-import-file').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file||!allowed)return;let count=0;try{if(file.size>10*1024*1024)throw Error('Arquivo excede 10 MB.');const data=JSON.parse(await file.text());if(data.format!=='contrata-sul-crm'||data.version!==1||data.projectId!=='contrata-sul'||!data.collections)throw Error('Arquivo não é um backup CRM válido.');const names=[...Object.values(collections),'crm_relacionamentos'];for(const name of names){const rows=data.collections[name]||[];if(!Array.isArray(rows)||rows.length>2000)throw Error('Coleção inválida: '+name);for(const row of rows){if(!row||typeof row!=='object'||typeof row.id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(row.id))throw Error('ID inválido em '+name);if(name!=='crm_relacionamentos'&&(!row.companyId||!state.companies.some(c=>c.id===row.companyId)))throw Error('Empresa não encontrada para um registro em '+name);if(name==='crm_relacionamentos'&&!state.companies.some(c=>c.id===row.id))throw Error('Empresa do relacionamento não encontrada');for(const [key,value] of Object.entries(row)){if(!['createdAt','updatedAt'].includes(key)&&typeof value==='object'&&value!==null)throw Error('Campo não suportado em '+name);if(typeof value==='string'&&value.length>1200)throw Error('Texto excessivo em '+name);}}count+=rows.length;}if(count>5000)throw Error('Backup excede 5.000 registros.');if(!confirm(`Restaurar ${count} registros do CRM? Dados existentes com mesmo ID serão atualizados. Faça backup antes.`))return;const user=auth.currentUser;if(!user?.email)throw Error('Sessão inválida.');const password=prompt('Confirme a senha atual da conta administrativa:');if(password===null)return;await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));let done=0;for(const name of names){const rows=data.collections[name]||[];for(let i=0;i<rows.length;i+=100){const group=rows.slice(i,i+100);const existing=await Promise.all(group.map(row=>getDoc(doc(db,name,row.id))));const batch=writeBatch(db);for(let k=0;k<group.length;k++){const row=group[k],old=existing[k].exists()?existing[k].data():null;const {id,createdAt,updatedAt,...fields}=row;if(name==='crm_atividades'&&old)continue;const record={...fields,updatedAt:serverTimestamp()};if(name!=='crm_relacionamentos')record.createdAt=old?.createdAt||(createdAt&&Number.isFinite(Date.parse(createdAt))?Timestamp.fromDate(new Date(createdAt)):serverTimestamp());batch.set(doc(db,name,id),record);}await batch.commit();done+=group.length;feedback(`Restauração CRM: ${done} de ${count} registros.`);}}feedback(`CRM restaurado: ${done} registros. Confira os dados.`);}catch(error){feedback('Restauração interrompida: '+(error.code||error.message)+'. Verifique se houve importação parcial.');}finally{event.target.value='';}});

// Pesquisas locais nos módulos empresariais, sem leituras extras no Firestore.
for(const type of ['requests','contacts','tasks','notes']){
 const input=$(`crm-${type}-search`);input?.addEventListener('input',()=>renderList(type));
}
