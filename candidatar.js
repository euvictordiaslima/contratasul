import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,doc,getDoc,collection,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getStorage,ref,uploadBytesResumable,deleteObject} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import {firebaseConfig} from './firebase-config.js';

// Uma instância separada mantém o login anônimo de candidaturas isolado do painel administrativo.
const app=getApps().find(a=>a.name==='contrataSulCandidaturas')||initializeApp(firebaseConfig,'contrataSulCandidaturas');
const db=getFirestore(app),auth=getAuth(app),storage=getStorage(app);
const params=new URLSearchParams(location.search),jobId=params.get('vaga');
const $=id=>document.getElementById(id);
const digits=value=>String(value||'').replace(/\D/g,'');
const MAX_BYTES=5*1024*1024;
const MIME={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
let job=null,submitting=false;

function showStatus(message,kind='info'){
 const el=$('app-status');el.textContent=message;el.dataset.kind=kind;
}
async function init(){
 try{
  if(!jobId||!/^[a-zA-Z0-9_-]{1,128}$/.test(jobId))throw Error('ID inválido');
  const snapshot=await getDoc(doc(db,'vagas',jobId));
  if(!snapshot.exists()||snapshot.data().published!==true)throw Error('Vaga indisponível');
  job=snapshot.data();
  $('job-label').textContent=[job.title,job.company,job.location].filter(Boolean).join(' · ');
  $('application-form').hidden=false;
 }catch(error){$('job-label').textContent='Esta vaga não está disponível. Consulte outras oportunidades no site.';}
}
init();

$('app-preference').addEventListener('change',()=>{
 const email=$('app-email'),pref=$('app-preference').value;
 email.required=pref==='E-mail';email.setAttribute('aria-required',String(email.required));
});

async function validateFile(file){
 if(!file)throw Error('Anexe seu currículo para continuar.');
 const ext=String(file.name).split('.').pop().toLowerCase();
 if(!Object.hasOwn(MIME,ext))throw Error('Envie o currículo em PDF ou DOCX.');
 if(file.size<100||file.size>MAX_BYTES)throw Error('O currículo precisa ter até 5 MB e não pode estar vazio.');
 // Checagem básica de assinatura: não substitui uma análise antimalware no servidor.
 const signature=new Uint8Array(await file.slice(0,5).arrayBuffer());
 if(ext==='pdf'&&String.fromCharCode(...signature)!=='%PDF-')throw Error('Este arquivo não parece ser um PDF válido.');
 if(ext==='docx'&&!(signature[0]===0x50&&signature[1]===0x4b))throw Error('Este arquivo não parece ser um DOCX válido.');
 return {ext,contentType:MIME[ext],size:file.size,name:String(file.name).replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,120)};
}
function formatSize(bytes){return (bytes/1024/1024).toLocaleString('pt-BR',{maximumFractionDigits:2})+' MB';}
function resetProgress(){const bar=$('upload-progress');bar.hidden=true;$('upload-meter').value=0;$('upload-percent').textContent='0%';}
$('app-resume').addEventListener('invalid',()=>{
 showStatus('É obrigatório anexar o currículo em PDF ou DOCX para enviar a candidatura.','error');
 document.querySelector('.resume-upload')?.scrollIntoView({block:'center',behavior:'smooth'});
});
$('app-resume').addEventListener('change',async()=>{
 resetProgress();const file=$('app-resume').files?.[0];
 if(!file){$('resume-file-label').textContent='Selecionar arquivo PDF ou DOCX';$('resume-file-meta').textContent='Até 5 MB · obrigatório';return;}
 try{const meta=await validateFile(file);$('resume-file-label').textContent=meta.name;$('resume-file-meta').textContent=formatSize(meta.size)+' · pronto para enviar';showStatus('');}
 catch(error){$('app-resume').value='';$('resume-file-label').textContent='Selecionar arquivo PDF ou DOCX';$('resume-file-meta').textContent=error.message;showStatus(error.message,'error');}
});

function uploadFile(file,path,contentType){
 return new Promise((resolve,reject)=>{
  const task=uploadBytesResumable(ref(storage,path),file,{contentType,customMetadata:{purpose:'candidatura'}});
  $('upload-progress').hidden=false;
  task.on('state_changed',snapshot=>{
   const pct=Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100);
   $('upload-meter').value=pct;$('upload-percent').textContent=pct+'%';
   showStatus(`Enviando currículo... ${pct}%`);
  },reject,()=>resolve(task.snapshot));
 });
}

$('application-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!job||submitting)return;
 if($('app-website').value)return;
 const name=$('app-name').value.trim(),email=$('app-email').value.trim().toLowerCase(),phone=digits($('app-phone').value),contactPreference=$('app-preference').value,message=$('app-message').value.trim();
 const focusError=(message,id)=>{showStatus(message,'error');$(id).focus();};
 if(name.length<2){focusError('Informe seu nome completo.','app-name');return;}
 if(phone.length<10||phone.length>13){focusError('Informe um celular válido com DDD.','app-phone');return;}
 if(contactPreference==='E-mail'&&!email){focusError('Informe um e-mail ou escolha WhatsApp ou ligação.','app-email');return;}
 if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){focusError('Confira o e-mail informado.','app-email');return;}
 if(!$('app-consent').checked){focusError('Confirme a autorização para uso dos dados.','app-consent');return;}
 let fileInfo;const file=$('app-resume').files?.[0];
 try{fileInfo=await validateFile(file);}catch(error){focusError(error.message,'app-resume');return;}
 const button=$('app-submit');button.disabled=true;submitting=true;
 let path=null,uploaded=false;
 try{
  showStatus('Preparando envio seguro do currículo...');
  const user=auth.currentUser||(await signInAnonymously(auth)).user;
  if(!user?.isAnonymous)throw Error('Não foi possível iniciar uma sessão de candidatura.');
  const candidateRef=doc(collection(db,'candidaturas'));
  path=`curriculos/${user.uid}/${candidateRef.id}/curriculo.${fileInfo.ext}`;
  await uploadFile(file,path,fileInfo.contentType);uploaded=true;
  showStatus('Currículo recebido. Finalizando candidatura...');
  await setDoc(candidateRef,{
   jobId,jobTitle:job.title,name,email,phone,contactPreference,message,consent:true,stage:'Recebido',
   resumePath:path,resumeName:fileInfo.name,resumeType:fileInfo.contentType,resumeSize:fileInfo.size,uploaderUid:user.uid,
   createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
  $('application-form').hidden=true;
  showStatus('Candidatura enviada com currículo! A equipe poderá entrar em contato pelo meio escolhido.','success');
 }catch(error){
  console.warn('Falha ao enviar candidatura:',error?.code||error?.message);
  if(uploaded&&path){try{await deleteObject(ref(storage,path));}catch(cleanupError){console.warn('Não foi possível limpar upload incompleto:',cleanupError.code);}}
  const code=String(error?.code||'');
  let message='Não foi possível concluir o envio. Verifique a conexão e tente novamente.';
  if(code==='auth/operation-not-allowed')message='O administrador precisa ativar a autenticação anônima no Firebase Authentication.';
  else if(code==='storage/unauthorized'||code==='permission-denied')message='O envio foi bloqueado. O administrador precisa publicar as regras do Firestore e do Storage.';
  else if(code==='storage/quota-exceeded')message='O armazenamento está sem espaço disponível. Avise a equipe da Contrata Sul.';
  else if(code==='storage/canceled')message='O envio do arquivo foi cancelado.';
  else if(code==='storage/unknown')message='Falha no armazenamento. Verifique sua conexão ou tente outro arquivo PDF.';
  showStatus(message,'error');button.disabled=false;
 }finally{submitting=false;}
});
