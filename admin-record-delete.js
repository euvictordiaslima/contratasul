import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {firebaseConfig} from './firebase-config.js';
import {getAuth,onAuthStateChanged,reauthenticateWithCredential,EmailAuthProvider} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,getDocsFromServer,deleteDoc,query,where,limit,addDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=getApps()[0]||initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const allowedNames={empresas:'Empresas',candidaturas:'Candidaturas',entrevistas:'Entrevistas',crm_contatos:'Contatos',crm_vinculos:'Profissionais vinculados',crm_solicitacoes:'Solicitações',crm_tarefas:'Tarefas',crm_atividades:'Anotações',crm_relacionamentos:'Situação comercial',crm_propostas:'Propostas',crm_financeiro:'Financeiro',crm_documentos:'Documentos (referências)',crm_avaliacoes:'Avaliações',portal_empresas:'Acessos empresariais',midia_site:'Mídias do site'};
const $$=sel=>document.querySelector(sel);
let isAdmin=false,selected=null,rows=[];
const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function display(row){return row.name||row.tradeName||row.candidateName||row.title||row.role||row.author||row.text||row.companyName||row.email||row.id||'Registro';}
function searchable(row){return Object.entries(row).filter(([key,value])=>!['createdAt','updatedAt'].includes(key)&&['string','number','boolean'].includes(typeof value)).map(([,value])=>String(value)).join(' ');}
function note(text){$('delete-count').textContent=text;}
function protectedId(id){return typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);}
async function reload(){
 const coll=$('delete-collection').value;
 rows=[];$('delete-list').replaceChildren();
 if(!isAdmin){note('Entre como administrador para consultar registros.');return;}
 if(!Object.hasOwn(allowedNames,coll)){note('Selecione um tipo permitido.');return;}
 note('Consultando '+allowedNames[coll]+'...');
 try{const snapshot=await getDocsFromServer(collection(db,coll));if(coll!==$('delete-collection').value)return;rows=snapshot.docs.map(item=>({id:item.id,...item.data()}));render();}
 catch(e){note('Não foi possível carregar: '+(e.code||e.message));}
}
function render(){
 const coll=$('delete-collection').value,term=norm($('delete-search').value);
 const matching=rows.filter(r=>norm(searchable(r)).includes(term)).sort((a,b)=>String(display(a)).localeCompare(String(display(b)),'pt-BR'));
 note(`${matching.length} de ${rows.length} registro(s) — ${allowedNames[coll]}`);
 const root=$('delete-list');root.replaceChildren();
 for(const item of matching.slice(0,100)){
  const row=document.createElement('div');row.className='delete-row';
  const info=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=display(item);meta.textContent=[item.city,item.phone,item.status,item.companyName].filter(x=>typeof x==='string'&&x).join(' · ')||`ID: ${item.id}`;
  info.append(name,meta);
  const button=document.createElement('button');button.className='danger';button.type='button';button.textContent='Excluir';button.addEventListener('click',()=>startDelete(coll,item.id,display(item)));
  row.append(info,button);root.append(row);
 }
 if(!matching.length){const empty=document.createElement('p');empty.textContent='Nenhum registro encontrado.';root.append(empty);}
 if(matching.length>100){const tip=document.createElement('p');tip.textContent='Mostrando 100 registros. Use a pesquisa para localizar os demais.';root.append(tip);}
}
function startDelete(coll,id,label){
 if(!isAdmin||!Object.hasOwn(allowedNames,coll)||!protectedId(id))return;
 selected={coll,id,label:String(label||'Registro').slice(0,160)};
 $('record-delete-description').textContent=`Excluir definitivamente ${allowedNames[coll].toLowerCase()}: “${selected.label}”? Esta operação não pode ser desfeita por este painel. Faça backup antes.`;
 $('record-delete-password').value='';$('record-delete-error').textContent='';
 $('record-delete-dialog').showModal();
}
function close(){selected=null;$('record-delete-password').value='';$('record-delete-dialog').close();}
$('record-delete-cancel').addEventListener('click',close);
$('record-delete-dialog').addEventListener('close',()=>{selected=null;$('record-delete-password').value=''});
$('delete-collection').addEventListener('change',reload);$('delete-refresh').addEventListener('click',reload);$('delete-search').addEventListener('input',render);
document.addEventListener('admin-request-delete',event=>{const {collection,id,label}=event.detail||{};startDelete(collection,id,label)});

// Impede remoção de empresa/candidato com informações dependentes. Não apaga outros registros silenciosamente.
async function ensureNoDependencies(coll,id,data){
 const dependent=[];
 async function has(path,field,value){if(!value)return;const snap=await getDocsFromServer(query(collection(db,path),where(field,'==',value),limit(1)));if(!snap.empty)dependent.push(path);}
 if(coll==='empresas'){
  const paths=['crm_vinculos','crm_solicitacoes','crm_contatos','crm_tarefas','crm_atividades','crm_propostas','crm_financeiro','crm_documentos','crm_avaliacoes','portal_empresas'];
  for(const path of paths)await has(path,'companyId',id);
  const relation=await getDoc(doc(db,'crm_relacionamentos',id));if(relation.exists())dependent.push('crm_relacionamentos');
  await has('vagas','company',data.name);
  if(data.tradeName&&data.tradeName!==data.name)await has('vagas','company',data.tradeName);
  if(data.cnpj)await has('vagas','cnpj',data.cnpj);
 }
 if(coll==='candidaturas'){
  await has('entrevistas','candidateId',id);await has('crm_vinculos','candidateId',id);
 }
 if(dependent.length)throw Error('Exclusão bloqueada. Existem vínculos nas coleções: '+[...new Set(dependent)].join(', ')+'. Exclua ou resolva esses registros antes.');
}
$('record-delete-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!selected||!isAdmin)return;
 const button=$('record-delete-confirm'),error=$('record-delete-error'),password=$('record-delete-password').value;
 const {coll,id}=selected,user=auth.currentUser;button.disabled=true;error.textContent='';
 try{
  if(!user?.email)throw Error('Conta sem e-mail de autenticação.');
  await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,password));
  const ref=doc(db,coll,id),snapshot=await getDoc(ref);if(!snapshot.exists())throw Error('Registro não existe mais.');
  await ensureNoDependencies(coll,id,snapshot.data());
  await deleteDoc(ref);
  // Histórico é imutável para operação de negócio; append-only, mesmo se falhar.
  try{await addDoc(collection(db,'historico'),{action:'Exclusão administrativa',detail:`${allowedNames[coll]}: ${id}`.slice(0,180),actor:user.uid,at:serverTimestamp()});}catch{}
  close();note('Registro excluído com sucesso. Atualizando a lista...');await reload();
 }catch(e){const messages={'auth/invalid-credential':'Senha incorreta.','auth/wrong-password':'Senha incorreta.','permission-denied':'Acesso negado. Verifique as Rules e a sessão.'};error.textContent=messages[e.code]||e.message||'Não foi possível excluir.';}
 finally{button.disabled=false;$('record-delete-password').value='';}
});
onAuthStateChanged(auth,async user=>{
 isAdmin=false;rows=[];render();if(!user)return;
 try{const record=await getDoc(doc(db,'admins',user.uid));isAdmin=record.exists()&&record.data().active===true;if(isAdmin)reload();}
 catch(e){note('Não foi possível confirmar permissões: '+(e.code||e.message));}
});
