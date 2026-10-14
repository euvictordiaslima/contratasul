import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,onSnapshot,addDoc,updateDoc,writeBatch,Timestamp,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);let unsub=null,jobs=[],backupPending=null,adminReady=false;
function status(text){$('status').textContent=text}
function el(tag,text){const e=document.createElement(tag);e.textContent=text;return e}
function clear(){ $('vacancy-form').reset();$('vacancy-id').value='';$('form-heading').textContent='Cadastrar vaga'}
$('clear').addEventListener('click',clear);
$('login-form').addEventListener('submit',async e=>{
 e.preventDefault();
 const entered=$('username').value.trim();
 const password=$('password').value;
 status('Verificando acesso…');
 try {
  let email=entered;
  if(!entered.includes('@')){
   if(entered.toLowerCase() !== 'beto'){
    status('Usuário não cadastrado. Confira seu login ou utilize o e-mail da conta.');return;
   }
   const configured=String(window.CONTRATA_SUL_ADMIN_EMAIL || '').trim();
   if(configured && configured.includes('@')){
    email=configured;
   }else{
    try{
     const alias=await getDoc(doc(db,'loginAliases','beto'));
     if(!alias.exists() || !alias.data().email){
      status('Usuário não vinculado à conta de autenticação. Utilize o e-mail cadastrado ou conclua a configuração inicial.');return;
     }
     email=alias.data().email;
    }catch(error){
     status('Não foi possível consultar o usuário. Entre usando o e-mail cadastrado na autenticação.');return;
    }
   }
  }
  await signInWithEmailAndPassword(auth,email,password);
  $('password').value='';
 }catch(error){
  console.error('Falha de autenticação:',error.code);
  const messages={
   'auth/invalid-credential':'E-mail ou senha não reconhecidos pelo Firebase Authentication. Confira a conta na aba Usuários e redefina a senha se necessário.',
   'auth/invalid-email':'O e-mail informado não é válido.',
   'auth/user-disabled':'Esta conta está desativada no Firebase Authentication.',
   'auth/operation-not-allowed':'Ative o método E-mail/Senha no Firebase Authentication.',
   'auth/too-many-requests':'Muitas tentativas. Aguarde antes de tentar novamente.'
  };
  status(messages[error.code]||('Não foi possível entrar: '+(error.code||'erro desconhecido')));
 }
});
$('logout').addEventListener('click',()=>signOut(auth));
onAuthStateChanged(auth,async user=>{if(unsub){unsub();unsub=null} $('admin-panel').hidden=true;$('login-panel').hidden=true;clear();if(!user){adminReady=false;backupPending=null;$('backup-preview').hidden=true;$('restore-backup').disabled=true;$('login-panel').hidden=false;return}try{const marker=await getDoc(doc(db,'admins',user.uid));if(!marker.exists()||marker.data().active!==true){status('Esta conta não possui permissão de administrador.');await signOut(auth);return} adminReady=true;$('admin-panel').hidden=false;status('Acesso autorizado.');unsub=onSnapshot(collection(db,'vagas'),snapshot=>{jobs=snapshot.docs.map(d=>({id:d.id,...d.data()}));render()},error=>status('Erro ao consultar vagas: '+error.code))}catch(e){status('Não foi possível verificar a autorização: '+e.code);await signOut(auth)}});
function render(){$('metric-total').textContent=jobs.length;$('metric-published').textContent=jobs.filter(j=>j.published).length;$('metric-drafts').textContent=jobs.filter(j=>!j.published).length;const box=$('vacancies');box.replaceChildren();$('count').textContent='('+jobs.length+')';if(!jobs.length){box.append(el('p','Nenhuma vaga cadastrada.'));return}for(const j of jobs){const row=document.createElement('article');row.className='vacancy';row.append(el('h3',j.title),el('p',[j.company,j.location,j.mode].filter(Boolean).join(' · ')),el('span',j.published?'Publicada':'Rascunho'));row.lastChild.className='status-tag';const actions=document.createElement('div');actions.className='actions';const edit=el('button','Editar'),toggle=el('button',j.published?'Encerrar publicação':'Publicar');toggle.className='secondary';edit.addEventListener('click',()=>{for(const key of ['title','company','location','mode','contract','salary','description'])$(key).value=j[key]||'';$('published').checked=!!j.published;$('vacancy-id').value=j.id;$('form-heading').textContent='Editar vaga';$('vacancy-form').scrollIntoView({behavior:'smooth'});});toggle.addEventListener('click',async()=>{if(!confirm((j.published?'Encerrar':'Publicar')+' esta vaga?'))return;try{await updateDoc(doc(db,'vagas',j.id),{published:!j.published,updatedAt:serverTimestamp()});status('Situação atualizada.')}catch(e){status('Erro ao atualizar: '+e.code)}});actions.append(edit,toggle);row.append(actions);box.append(row)}}
$('vacancy-form').addEventListener('submit',async e=>{e.preventDefault();const data={};for(const key of ['title','company','location','mode','contract','salary','description'])data[key]=$(key).value.trim();data.published=$('published').checked;const id=$('vacancy-id').value;const btn=$('save-button');btn.disabled=true;try{if(id){await updateDoc(doc(db,'vagas',id),{...data,updatedAt:serverTimestamp()})}else{await addDoc(collection(db,'vagas'),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}clear();status('Vaga salva com sucesso.')}catch(e){status('Não foi possível salvar: '+e.code)}finally{btn.disabled=false}});

// Navegação interna do painel.
document.querySelectorAll('.admin-tabs .tab').forEach(tab=>tab.addEventListener('click',()=>{
 document.querySelectorAll('.admin-tabs .tab').forEach(item=>{item.classList.toggle('active',item===tab);item.setAttribute('aria-selected',String(item===tab))});
 for(const id of ['tab-jobs','tab-backup'])$(id).hidden=id!==tab.dataset.target;
}));

// Backup próprio das vagas (somente conta administrativa autenticada).
const backupFields=['title','company','location','mode','contract','salary','description','published'];
const safeId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);
function normalizeJob(row){
 if(!row||typeof row!=='object'||Array.isArray(row)||!safeId(row.id))throw Error('ID de vaga inválido');
 const out={id:row.id};
 for(const field of backupFields){
  if(field==='published'){if(typeof row[field]!=='boolean')throw Error('Status de publicação inválido');out[field]=row[field];continue}
  if(typeof row[field]!=='string')throw Error('Campo inválido: '+field);
  const limits={title:100,company:100,location:100,mode:20,contract:100,salary:100,description:2500};
  if(row[field].length>limits[field]||(field==='title'&&!row[field].trim()))throw Error('Campo fora do limite: '+field);
  out[field]=row[field];
 }
 if(!['Presencial','Híbrido','Remoto'].includes(out.mode))throw Error('Modalidade inválida');
 const parseTime=value=>{
  if(value===null||value===undefined)return null;
  if(typeof value!=='string'||!/^\\d{4}-\\d{2}-\\d{2}T/.test(value)||Number.isNaN(Date.parse(value)))throw Error('Data inválida');
  return value;
 };
 out.createdAt=parseTime(row.createdAt);out.updatedAt=parseTime(row.updatedAt);
 return out;
}
function backupMessage(message){$('backup-result').textContent=message;status(message)}
$('export-backup').addEventListener('click',async()=>{
 if(!adminReady||!auth.currentUser)return;
 const button=$('export-backup');button.disabled=true;
 try{
  // Busca diretamente no servidor, incluindo rascunhos, para evitar exportar dados incompletos.
  const {getDocsFromServer}=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  const snapshot=await getDocsFromServer(collection(db,'vagas'));
  const entries=snapshot.docs.map(item=>{
   const data=item.data(),record={id:item.id};
   for(const key of backupFields)record[key]=data[key];
   record.createdAt=data.createdAt?.toDate?.().toISOString()||null;
   record.updatedAt=data.updatedAt?.toDate?.().toISOString()||null;
   return normalizeJob(record);
  });
  const payload={format:'contrata-sul-vagas',version:1,exportedAt:new Date().toISOString(),projectId:'contrata-sul',count:entries.length,vagas:entries};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');link.href=url;link.download='contrata-sul-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  backupMessage('Backup gerado com '+entries.length+' vaga(s). Guarde o arquivo em local seguro.');
 }catch(e){backupMessage('Não foi possível exportar: '+(e.code||e.message))}
 finally{button.disabled=false}
});
$('backup-file').addEventListener('change',async event=>{
 backupPending=null;$('restore-backup').disabled=true;$('backup-preview').hidden=true;
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>5*1024*1024)throw Error('Arquivo maior que 5 MB');
  const payload=JSON.parse(await file.text());
  if(payload.format!=='contrata-sul-vagas'||payload.version!==1||payload.projectId!=='contrata-sul'||!Array.isArray(payload.vagas))throw Error('Arquivo não é um backup compatível');
  if(payload.vagas.length>3000||payload.count!==payload.vagas.length)throw Error('Quantidade de registros inválida');
  const rows=payload.vagas.map(normalizeJob);
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('IDs duplicados no backup');
  backupPending=rows;
  $('backup-preview').hidden=false;
  $('backup-preview').textContent=`Arquivo validado: ${rows.length} vaga(s), ${rows.filter(row=>row.published).length} publicada(s). Backup de ${payload.exportedAt?new Date(payload.exportedAt).toLocaleString('pt-BR'):'data não informada'}.`;
  $('restore-backup').disabled=!adminReady;
  backupMessage('Backup validado. Confirme a restauração para gravar as vagas no Firestore.');
 }catch(e){backupMessage('Arquivo rejeitado: '+e.message)}
});
$('restore-backup').addEventListener('click',async()=>{
 if(!adminReady||!auth.currentUser||!backupPending)return;
 const rows=backupPending;
 if(!confirm(`Restaurar ${rows.length} vaga(s) no Firestore? Vagas com mesmo ID serão substituídas. As demais serão mantidas.`))return;
 const button=$('restore-backup');button.disabled=true;
 let done=0;
 try{
  // Lotes limitados a 200 gravações; preservar o createdAt original quando possível.
  for(let i=0;i<rows.length;i+=200){
   const batch=writeBatch(db);
   for(const row of rows.slice(i,i+200)){
    const {id,createdAt,updatedAt,...fields}=row;
    batch.set(doc(db,'vagas',id),{...fields,createdAt:createdAt?Timestamp.fromDate(new Date(createdAt)):serverTimestamp(),updatedAt:updatedAt?Timestamp.fromDate(new Date(updatedAt)):serverTimestamp()});
   }
   await batch.commit();done+=Math.min(200,rows.length-i);
   backupMessage(`Restauração: ${done} de ${rows.length} vaga(s) processadas.`);
  }
  backupPending=null;$('backup-file').value='';$('backup-preview').hidden=true;
  backupMessage('Restauração concluída: '+done+' vaga(s). Os dados foram enviados ao Firestore.');
 }catch(e){backupMessage(`Restauração interrompida após ${done} vaga(s). Verifique o banco antes de tentar novamente. Erro: ${e.code||e.message}`)}
 finally{button.disabled=!backupPending}
});
