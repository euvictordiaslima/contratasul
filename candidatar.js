import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,doc,getDoc,collection,writeBatch,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {firebaseConfig} from './firebase-config.js';
import {MAX_RESUME_BYTES,validateResume,encodeResume,formatResumeSize} from './resume-utils.js';
// O login anônimo do candidato não altera a sessão do administrador.
const app=getApps().find(a=>a.name==='contrataSulCandidaturas')||initializeApp(firebaseConfig,'contrataSulCandidaturas');
const db=getFirestore(app),auth=getAuth(app),params=new URLSearchParams(location.search),jobId=params.get('vaga');
const $=id=>document.getElementById(id),digits=value=>String(value||'').replace(/\D/g,'');
let job=null,submitting=false;
function showStatus(message,kind='info'){$('app-status').textContent=message;$('app-status').dataset.kind=kind;}
async function init(){
 try{
  if(!jobId||!/^[a-zA-Z0-9_-]{1,128}$/.test(jobId))throw Error('ID inválido');
  const snapshot=await getDoc(doc(db,'vagas',jobId));
  if(!snapshot.exists()||snapshot.data().published!==true)throw Error('Vaga indisponível');
  job=snapshot.data();$('job-label').textContent=[job.title,job.company,job.location].filter(Boolean).join(' · ');
  $('application-form').hidden=false;
 }catch{$('job-label').textContent='Esta vaga não está disponível. Consulte outras oportunidades no site.';}
}
init();
$('app-preference').addEventListener('change',()=>{
 const email=$('app-email');email.required=$('app-preference').value==='E-mail';email.setAttribute('aria-required',String(email.required));
});
$('app-resume').addEventListener('invalid',()=>{
 showStatus('Anexe um currículo PDF ou DOCX para enviar sua candidatura.','error');
 document.querySelector('.resume-upload')?.scrollIntoView({block:'center',behavior:'smooth'});
});
$('app-resume').addEventListener('change',async()=>{
 const file=$('app-resume').files?.[0];
 if(!file){$('resume-file-label').textContent='Selecionar arquivo PDF ou DOCX';$('resume-file-meta').textContent='Até 350 KB · obrigatório';return;}
 try{const meta=await validateResume(file);$('resume-file-label').textContent=meta.name;$('resume-file-meta').textContent=formatResumeSize(meta.size)+' · pronto para enviar';showStatus('');}
 catch(error){$('app-resume').value='';$('resume-file-label').textContent='Selecionar arquivo PDF ou DOCX';$('resume-file-meta').textContent=error.message;showStatus(error.message,'error');}
});
$('application-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!job||submitting||$('app-website').value)return;
 const name=$('app-name').value.trim(),email=$('app-email').value.trim().toLowerCase(),phone=digits($('app-phone').value),contactPreference=$('app-preference').value,message=$('app-message').value.trim();
 const focusError=(message,id)=>{showStatus(message,'error');$(id).focus();};
 if(name.length<2){focusError('Informe seu nome completo.','app-name');return;}
 if(phone.length<10||phone.length>13){focusError('Informe um celular válido com DDD.','app-phone');return;}
 if(contactPreference==='E-mail'&&!email){focusError('Informe um e-mail ou escolha WhatsApp ou ligação.','app-email');return;}
 if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){focusError('Confira o e-mail informado.','app-email');return;}
 if(!$('app-consent').checked){focusError('Autorize o tratamento dos seus dados para continuar.','app-consent');return;}
 const file=$('app-resume').files?.[0];let info;
 try{info=await validateResume(file);}catch(error){focusError(error.message,'app-resume');return;}
 const button=$('app-submit');button.disabled=true;submitting=true;
 try{
  showStatus('Preparando currículo para envio privado...');
  const user=auth.currentUser||(await signInAnonymously(auth)).user;
  if(!user?.isAnonymous)throw Error('Não foi possível iniciar uma sessão de candidatura.');
  const base64=await encodeResume(file);
  if(base64.length>480000)throw Error('Arquivo muito grande para o plano gratuito.');
  const candidateRef=doc(collection(db,'candidaturas'));
  const resumeRef=doc(db,'curriculos',candidateRef.id);
  const batch=writeBatch(db);
  batch.set(candidateRef,{
   jobId,jobTitle:job.title,name,email,phone,contactPreference,message,consent:true,stage:'Recebido',
   resumeStore:'firestore-v1',resumeName:info.name,resumeType:info.type,resumeSize:info.size,uploaderUid:user.uid,
   createdAt:serverTimestamp(),updatedAt:serverTimestamp()
  });
  batch.set(resumeRef,{
   candidateId:candidateRef.id,ownerUid:user.uid,fileName:info.name,fileType:info.type,fileSize:info.size,
   contentBase64:base64,createdAt:serverTimestamp()
  });
  showStatus('Enviando candidatura e currículo com segurança...');
  await batch.commit(); // tudo ou nada: não deixa candidatura sem currículo
  $('application-form').hidden=true;
  showStatus('Candidatura enviada com currículo! A equipe poderá entrar em contato pelo meio escolhido.','success');
 }catch(error){
  console.warn('Falha ao enviar candidatura:',error?.code||error?.message);
  const code=String(error?.code||'');let message='Não foi possível enviar. Verifique a conexão e tente novamente.';
  if(code==='auth/operation-not-allowed')message='A Contrata Sul precisa habilitar o login anônimo no Firebase Authentication.';
  else if(code==='permission-denied')message='Envio bloqueado. O administrador precisa publicar as novas regras do Firestore.';
  else if(code==='resource-exhausted')message='O limite gratuito do Firestore foi atingido. Tente mais tarde ou avise a equipe.';
  else if(error?.message&&/350 KB|grande/.test(error.message))message=error.message;
  showStatus(message,'error');button.disabled=false;
 }finally{submitting=false;}
});
