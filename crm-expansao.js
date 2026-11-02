import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {firebaseConfig} from './firebase-config.js';
import {getAuth,onAuthStateChanged,reauthenticateWithCredential,EmailAuthProvider} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocsFromServer,addDoc,setDoc,updateDoc,writeBatch,onSnapshot,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=getApps()[0]||initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const coll={offers:'crm_propostas',finance:'crm_financeiro',documents:'crm_documentos',feedback:'crm_avaliacoes',portal:'portal_empresas'};
const base=['crm_vinculos','crm_solicitacoes','crm_contatos','crm_tarefas','crm_atividades','crm_relacionamentos'];
const backupNames=[...base,...Object.values(coll).filter(v=>v!=='portal_empresas')];
const state={companies:[],jobs:[],candidates:[],interviews:[],people:[],requests:[],tasks:[],notes:[],offers:[],finance:[],documents:[],feedback:[],portal:[]};
const dataPaths={companies:'empresas',jobs:'vagas',candidates:'candidaturas',interviews:'entrevistas',people:'crm_vinculos',requests:'crm_solicitacoes',tasks:'crm_tarefas',notes:'crm_atividades',...coll};
let admin=false,selected='',unsub=[],formBusy=false,pendingBackup=null;
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const text=(tag,v='',cls='')=>{const e=document.createElement(tag);e.textContent=String(v??'');if(cls)e.className=cls;return e;};
const status=t=>{const e=$('crm-feedback-message');if(e)e.textContent=t;};
const inCompany=key=>state[key].filter(row=>row.companyId===selected);
const filteredOverview=(id,items)=>{const term=norm($(id)?.value);return term?items.filter(row=>norm(Object.values(row).map(x=>typeof x==='string'?x:'').join(' ')).includes(term)):items;};
const company=()=>state.companies.find(c=>c.id===selected);
const when=v=>{try{const d=v?.toDate?.()||new Date(v);return Number.isFinite(d.getTime())?d.toLocaleDateString('pt-BR'):'—';}catch{return '—';}};
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const fetchError=e=>e?.code==='permission-denied'?'Acesso negado pelas regras do Firestore. Publique o arquivo atualizado.':e?.code||e?.message||'Erro desconhecido';
const fitId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
const st=(k,v)=>$(k).value=v??'';
const value=k=>$(k).value.trim();
function clear(){for(const stop of unsub)stop();unsub=[];admin=false;selected='';Object.keys(state).forEach(k=>state[k]=[]);pendingBackup=null;$('crm-company-filter').value='';render();}
function listen(key,path){unsub.push(onSnapshot(collection(db,path),snap=>{state[key]=snap.docs.map(d=>({id:d.id,...d.data()}));render();},e=>status(`Não foi possível carregar ${path}: ${fetchError(e)}`)));}
onAuthStateChanged(auth,async user=>{clear();if(!user)return;try{const adminDoc=await getDoc(doc(db,'admins',user.uid));if(!adminDoc.exists()||adminDoc.data().active!==true)return;admin=true;for(const [key,path] of Object.entries(dataPaths))listen(key,path);}catch(e){status('Acesso administrativo não confirmado: '+fetchError(e));}});
document.addEventListener('crm-company-change',e=>{selected=e.detail.companyId;render();});

function jobs(){const c=company();if(!c)return[];return state.jobs.filter(j=>j.companyId===c.id||(j.cnpj&&c.cnpj&&j.cnpj===c.cnpj)||norm(j.company)===norm(c.name)||Boolean(c.tradeName&&norm(j.company)===norm(c.tradeName)));}
function candidates(){const ids=new Set(jobs().map(j=>j.id));return state.candidates.filter(c=>ids.has(c.jobId));}
function interviews(){const ids=new Set(candidates().map(c=>c.id));return state.interviews.filter(i=>ids.has(i.candidateId));}
function miniList(root,items,format){root.replaceChildren();if(!items.length){root.append(text('p','Nenhum registro vinculado.','crm-hint'));return;}for(const item of items.slice(0,12)){const row=text('div','','crm-overview-line');row.append(text('strong',format(item)[0]),text('span',format(item)[1]));root.append(row);}if(items.length>12)root.append(text('p',`Mais ${items.length-12} registro(s). Use a pesquisa nos módulos correspondentes.`,'crm-hint'));}
function renderOverview(){if(!company())return;
 miniList($('crm-overview-jobs'),filteredOverview('crm-overview-jobs-search',jobs()),j=>[j.title,j.published?'Publicada':'Rascunho']);
 miniList($('crm-overview-candidates'),filteredOverview('crm-overview-candidates-search',candidates()),c=>[c.name,c.stage||'Recebido']);
 miniList($('crm-overview-interviews'),filteredOverview('crm-overview-interviews-search',interviews()),i=>[i.candidateName,`${when(i.when)} · ${i.status}`]);
 const openTasks=inCompany('tasks').filter(x=>!x.done),openReq=inCompany('requests').filter(r=>r.status!=='Concluída');
 miniList($('crm-overview-next'),filteredOverview('crm-overview-next-search',[...openTasks.map(t=>({name:t.title,due:t.due||''})),...openReq.map(r=>({name:'Solicitação: '+r.role,due:r.due||''}))].sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'))),v=>[v.name,v.due?when(v.due+'T12:00:00'):'Sem prazo']);
}
function safeRow(title,meta,detail){const article=text('article','','crm-entry');const top=text('div','','crm-entry-top'),left=text('div','','crm-entry-content');left.append(text('strong',title),text('p',meta,'crm-entry-meta'));if(detail)left.append(text('small',detail));top.append(left);article.append(top);return article;}
function renderList(type){const list=$(`crm-${type}-list`);if(!list)return;list.replaceChildren();let rows=type==='portal'?state.portal.filter(x=>x.companyId===selected):inCompany(type);
 const search=$(`crm-${type}-search`);if(search)rows=rows.filter(r=>norm([r.title,r.status,r.description,r.details,r.due,r.category,r.reference,r.author,r.text,r.rating,r.amount,r.id].join(' ')).includes(norm(search.value)));
 rows=[...rows].sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 for(const row of rows.slice(0,80)){
  const main=type==='portal'?`Conta vinculada: ${row.id}`:row.title||row.author||'Registro sem título';
  const meta=type==='offers'?`${row.status} · ${money(row.amount)} · ${row.due?when(row.due+'T12:00:00'):'sem prazo'}`:
    type==='finance'?`${row.status} · ${money(row.amount)} · ${row.due?when(row.due+'T12:00:00'):'sem vencimento'}`:
    type==='documents'?`${row.category||'Outro'} · Controle de referência (sem arquivo anexado)`:
    type==='feedback'?`${row.rating} de 5 · ${row.author||'Sem responsável'}`:
    type==='portal'?(row.active?'Acesso autorizado':'Acesso suspenso'):'Registro';
  const entry=safeRow(main,meta,row.details||row.reference||row.text||'');
  if(['offers','finance'].includes(type)){
   const options=type==='offers'?['Rascunho','Enviada','Em negociação','Aprovada','Recusada']:['Pendente','Pago','Cancelado'];
   const actions=text('div','','crm-entry-actions');for(const option of options){if(option===row.status)continue;const btn=text('button',option,'secondary');btn.type='button';btn.addEventListener('click',()=>changeStatus(type,row,option,btn));actions.append(btn);}entry.append(actions);
  }
  if(type==='portal'){const btn=text('button',row.active?'Suspender acesso':'Reativar acesso','secondary');btn.type='button';btn.addEventListener('click',()=>portalToggle(row,btn));entry.append(btn);}
  list.append(entry);
 }
 if(rows.length>80)list.append(text('p','Exibindo 80 registros. Refine a pesquisa.','crm-hint'));
 if(!rows.length)list.append(text('p','Nenhum registro para esta empresa.','crm-hint'));
}
function renderPipeline(){const board=$('crm-pipeline-board');board.replaceChildren();if(!company())return;const term=norm($('crm-pipeline-search')?.value);for(const stage of ['Recebido','Em análise','Entrevista','Aprovado','Encerrado']){const col=text('section','','crm-pipeline-column');const people=candidates().filter(c=>c.stage===stage&&(!term||norm([c.name,c.phone,c.email,c.jobTitle,c.stage].join(' ')).includes(term)));col.append(text('h4',`${stage} · ${people.length}`));for(const p of people.slice(0,25)){const item=text('div','','crm-pipeline-entry');item.append(text('strong',p.name),text('p',p.jobTitle||'Cargo não informado'));col.append(item);}board.append(col);}}
function buildReport(){const c=company();if(!c)return;const target=$('crm-report-body');target.replaceChildren();const title=text('h3',c.tradeName||c.name);target.append(title,text('p',[c.name,c.city,c.state,c.cnpj?'CNPJ: '+c.cnpj:''].filter(Boolean).join(' · ')),text('small','Relatório gerado em '+new Date().toLocaleString('pt-BR')));
 const hiring=inCompany('people'),records=[['Vagas',jobs().length],['Vagas publicadas',jobs().filter(j=>j.published).length],['Candidaturas',candidates().length],['Entrevistas',interviews().length],['Profissionais contratados',hiring.filter(v=>v.status==='Contratado').length],['Em análise/entrevista',hiring.filter(v=>['Em análise','Entrevista','Aprovado'].includes(v.status)).length],['Solicitações abertas',inCompany('requests').filter(r=>r.status!=='Concluída').length],['Tarefas em aberto',inCompany('tasks').filter(t=>!t.done).length],['Propostas',inCompany('offers').length],['Pagamentos registrados',inCompany('finance').filter(f=>f.status==='Pago').length]];
 const table=text('table','','crm-report-table'),tbody=text('tbody');for(const [key,n] of records){const tr=text('tr');tr.append(text('th',key),text('td',String(n)));tbody.append(tr);}table.append(tbody);target.append(table);
 const finance=inCompany('finance'),pending=finance.filter(f=>f.status==='Pendente').reduce((s,v)=>s+Number(v.amount||0),0),paid=finance.filter(f=>f.status==='Pago').reduce((s,v)=>s+Number(v.amount||0),0);
 target.append(text('h4','Controle financeiro'),text('p',`Valores registrados: ${money(paid)} pagos · ${money(pending)} pendentes.`));
 const sectionTitle=text('h4','Contratações confirmadas');target.append(sectionTitle);
 const list=text('div');const hired=hiring.filter(v=>v.status==='Contratado');miniList(list,hired,v=>[v.candidateName,`${v.role||'Cargo não informado'} · ${v.hiredAt||'Data não informada'}`]);target.append(list);
 target.append(text('h4','Solicitações de contratação'));const list2=text('div');miniList(list2,inCompany('requests'),r=>[r.role||'Cargo',`${r.qty} profissional(is) · ${r.status||'Aberta'}`]);target.append(list2);
}
function renderFinance(){const bills=inCompany('finance');$('crm-finance-total').textContent=`Total pendente: ${money(bills.filter(x=>x.status==='Pendente').reduce((a,b)=>a+Number(b.amount||0),0))} | Total pago: ${money(bills.filter(x=>x.status==='Pago').reduce((a,b)=>a+Number(b.amount||0),0))}`;}
function render(){if(!admin||!company()){for(const el of ['crm-overview-jobs','crm-overview-candidates','crm-overview-interviews','crm-overview-next','crm-pipeline-board','crm-offers-list','crm-finance-list','crm-documents-list','crm-feedback-list','crm-portal-list','crm-report-body'])$(el)?.replaceChildren();return;}renderOverview();renderPipeline();for(const type of ['offers','finance','documents','feedback','portal'])renderList(type);renderFinance();buildReport();}
for(const type of ['offers','finance'])$(`crm-${type}-search`)?.addEventListener('input',()=>renderList(type));
function dataFor(type){const main={title:value(`crm-${type==='offers'?'offer':type==='finance'?'finance':'document'}-title`)};if(type==='offers')return {...main,status:value('crm-offer-status'),amount:Math.max(0,Number(value('crm-offer-amount')||0)),due:value('crm-offer-due'),details:value('crm-offer-details')};
 if(type==='finance')return {...main,status:value('crm-finance-status'),amount:Number(value('crm-finance-amount')),due:value('crm-finance-due'),details:value('crm-finance-details')};
 if(type==='documents')return {...main,category:value('crm-document-category'),reference:value('crm-document-reference')};
 if(type==='feedback')return {author:value('crm-feedback-author'),rating:Number(value('crm-feedback-rating')),text:value('crm-feedback-text')};throw Error('Tipo inválido');}
for(const type of ['offers','finance','documents','feedback'])$(`crm-${type}-form`).addEventListener('submit',async event=>{event.preventDefault();if(!admin||!company()||formBusy)return;formBusy=true;const btn=event.currentTarget.querySelector('button[type=submit]');btn.disabled=true;try{const data=dataFor(type);if('amount' in data&&!Number.isFinite(data.amount))throw Error('Valor inválido');await addDoc(collection(db,coll[type]),{...data,companyId:selected,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});event.currentTarget.reset();status('Registro salvo com sucesso no Firestore.');}catch(e){status('Não foi possível salvar: '+fetchError(e));}finally{btn.disabled=false;formBusy=false;}});
async function changeStatus(type,row,statusValue,btn){if(!admin||!selected||row.companyId!==selected)return;btn.disabled=true;try{await updateDoc(doc(db,coll[type],row.id),{status:statusValue,updatedAt:serverTimestamp()});status('Situação atualizada.');}catch(e){status('Não foi possível alterar: '+fetchError(e));}finally{btn.disabled=false;}}
$('crm-report-print').addEventListener('click',()=>{if(!company())return;document.body.classList.add('printing-crm');try{window.print();}finally{setTimeout(()=>document.body.classList.remove('printing-crm'),600);}});
$('crm-print').addEventListener('click',()=>{if(!company()){status('Selecione uma empresa antes de gerar o relatório.');return;}document.querySelector('[data-crm-tab="report"]')?.click();document.body.classList.add('printing-crm');try{window.print();}finally{setTimeout(()=>document.body.classList.remove('printing-crm'),600);}});
$('crm-report-csv').addEventListener('click',()=>$('crm-export').click());
$('crm-portal-form').addEventListener('submit',async e=>{e.preventDefault();if(!admin||!company())return;const uid=value('crm-portal-uid');if(!fitId(uid)){status('UID inválido.');return;}const btn=e.currentTarget.querySelector('button');btn.disabled=true;try{const ref=doc(db,'portal_empresas',uid);const existing=await getDoc(ref);if(existing.exists()&&existing.data().companyId!==selected)throw Error('Esta conta já pertence a outra empresa; altere o vínculo somente após revogar o antigo.');await setDoc(ref,{companyId:selected,companyName:company().name||'',tradeName:company().tradeName||'',active:value('crm-portal-active')==='true',createdAt:existing.exists()?existing.data().createdAt:serverTimestamp(),updatedAt:serverTimestamp()});e.currentTarget.reset();status('Vínculo do portal salvo. A conta já deve existir no Authentication.');}catch(err){status('Falha ao vincular portal: '+fetchError(err));}finally{btn.disabled=false;}});
async function portalToggle(row,btn){btn.disabled=true;try{await updateDoc(doc(db,'portal_empresas',row.id),{active:!row.active,updatedAt:serverTimestamp()});status('Acesso atualizado.');}catch(e){status('Não foi possível atualizar acesso: '+fetchError(e));}finally{btn.disabled=false;}}

// Exportação integral das coleções CRM (servidor, não cache), com verificações e sem usuários / permissões.
function download(payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`contrata-sul-crm-integral-${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function iso(v){if(!v)return null;const d=v.toDate?.()||new Date(v);return Number.isFinite(d.getTime())?d.toISOString():null;}
$('crm-full-backup').addEventListener('click',async()=>{if(!admin)return;const button=$('crm-full-backup');button.disabled=true;try{const all={};let total=0;for(const name of backupNames){const docs=await getDocsFromServer(collection(db,name));all[name]=docs.docs.map(d=>{const data=d.data();return {id:d.id,...data,createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt)};});total+=docs.size;}download({format:'contrata-sul-crm-completo',version:2,projectId:'contrata-sul',exportedAt:new Date().toISOString(),collections:all});status(`Backup integral CRM gerado com ${total} registros. Guarde-o em local privado.`);}catch(e){status('Falha ao exportar CRM: '+fetchError(e));}finally{button.disabled=false;}});
const allowfields={
 crm_vinculos:['companyId','candidateId','candidateName','role','status','hiredAt','note'],
 crm_solicitacoes:['companyId','role','qty','due','priority','note','status'],
 crm_contatos:['companyId','name','role','email','phone'],
 crm_tarefas:['companyId','title','owner','due','done'],
 crm_atividades:['companyId','type','text'],
 crm_relacionamentos:['status','owner'],
 crm_propostas:['companyId','title','status','amount','due','details'],
 crm_financeiro:['companyId','title','status','amount','due','details'],
 crm_documentos:['companyId','title','category','reference'],
 crm_avaliacoes:['companyId','author','rating','text']
};
function checkBackup(payload){if(payload?.format!=='contrata-sul-crm-completo'||payload.version!==2||payload.projectId!=='contrata-sul'||typeof payload.collections!=='object'||!payload.collections)throw Error('Arquivo não é um backup integral compatível.');const clean={},companies=new Set(state.companies.map(c=>c.id));let count=0;for(const name of backupNames){const entries=payload.collections[name]||[];if(!Array.isArray(entries)||entries.length>1500)throw Error(`Coleção inválida: ${name}`);const seen=new Set();clean[name]=entries.map(entry=>{if(!entry||typeof entry!=='object'||!fitId(entry.id)||seen.has(entry.id))throw Error(`ID inválido ou repetido em ${name}`);seen.add(entry.id);if(name!=='crm_relacionamentos'&&(!fitId(entry.companyId)||!companies.has(entry.companyId)))throw Error(`Empresa inexistente no banco para ${name}`);if(name==='crm_relacionamentos'&&!companies.has(entry.id))throw Error('Empresa não cadastrada para relacionamento');const obj={id:entry.id};for(const key of allowfields[name]){const v=entry[key];if(typeof v==='number'){if(!Number.isFinite(v)||Math.abs(v)>1000000000)throw Error('Número inválido');obj[key]=v;}else if(typeof v==='boolean')obj[key]=v;else if(v==null)obj[key]='';else if(typeof v==='string'&&v.length<=1200)obj[key]=v;else throw Error('Campo inválido em '+name+': '+key);}obj.createdAt=entry.createdAt;return obj;});count+=entries.length;}if(count>6000)throw Error('O arquivo excede 6.000 registros');return {clean,count};}
$('crm-full-import').addEventListener('change',async e=>{pendingBackup=null;$('crm-full-restore').disabled=true;const file=e.target.files?.[0];if(!file)return;try{if(file.size>15*1024*1024)throw Error('O arquivo excede 15 MB');pendingBackup=checkBackup(JSON.parse(await file.text()));$('crm-full-restore').disabled=!admin;$('crm-backup-preview').textContent=`Backup verificado: ${pendingBackup.count} registros. A restauração atualiza IDs existentes e não exclui outros. Faça uma cópia antes.`;}catch(err){$('crm-backup-preview').textContent='Arquivo rejeitado: '+err.message;}});
$('crm-full-restore').addEventListener('click',async()=>{if(!admin||!pendingBackup)return;const {clean,count}=pendingBackup;if(!confirm(`Restaurar ${count} registros? Esta operação altera seu Firestore e pode ser parcial em falha de conexão.`))return;const user=auth.currentUser;if(!user?.email){status('Sessão inválida.');return;}const password=prompt('Confirme a senha atual do administrador:');if(password===null)return;const button=$('crm-full-restore');button.disabled=true;let written=0;try{await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));for(const name of backupNames){const rows=clean[name];for(let i=0;i<rows.length;i+=100){const batch=writeBatch(db);let affected=0;for(const row of rows.slice(i,i+100)){
 const ref=doc(db,name,row.id),snap=await getDoc(ref);if(name==='crm_atividades'&&snap.exists())continue;
 const {id,createdAt,...fields}=row;
 const entry={...fields,updatedAt:serverTimestamp()};
 if(name!=='crm_relacionamentos'){entry.createdAt=snap.exists()?snap.data().createdAt:serverTimestamp();}
 batch.set(ref,entry);affected++;
 }if(affected){await batch.commit();written+=affected;$('crm-backup-preview').textContent=`Restauração: ${written} registro(s) gravados de até ${count}.`;}
 }}status(`Restauração concluída: ${written} registros gravados. Verifique os dados.`);pendingBackup=null;$('crm-full-import').value='';}catch(err){status(`Restauração interrompida após ${written} registros: ${fetchError(err)}. Pode ser necessário conferir dados parciais.`);}finally{button.disabled=!pendingBackup;}});

// Pesquisar qualquer lista da central, inclusive resumo, funil e portal.
for(const type of ['offers','finance','documents','feedback','portal'])$( `crm-${type}-search`)?.addEventListener('input',()=>renderList(type));
for(const type of ['jobs','candidates','interviews','next'])$(`crm-overview-${type}-search`)?.addEventListener('input',renderOverview);
$('crm-pipeline-search')?.addEventListener('input',renderPipeline);
