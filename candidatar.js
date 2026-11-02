import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,doc,getDoc,collection,addDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const app=getApps()[0]||initializeApp(firebaseConfig),db=getFirestore(app),params=new URLSearchParams(location.search),id=params.get('vaga'),$=key=>document.getElementById(key);let job=null;
const digits=value=>String(value||'').replace(/\D/g,'');
async function init(){
 try{if(!id||!/^[a-zA-Z0-9_-]{1,128}$/.test(id))throw Error('ID inválido');
  const snapshot=await getDoc(doc(db,'vagas',id));if(!snapshot.exists()||snapshot.data().published!==true)throw Error('Vaga indisponível');
  job=snapshot.data();$('job-label').textContent=job.title+' · '+job.company;$('application-form').hidden=false;
 }catch(error){$('job-label').textContent='Esta vaga não está disponível. Consulte as outras oportunidades no site.';}
}init();
$('app-preference').addEventListener('change',()=>{
 const email=$('app-email'),pref=$('app-preference').value;
 email.required=pref==='E-mail';email.setAttribute('aria-required',String(email.required));
});
$('application-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!job)return;
 if($('app-website').value)return; // campo invisível para reduzir envios automatizados simples
 const name=$('app-name').value.trim(),email=$('app-email').value.trim().toLowerCase(),phone=digits($('app-phone').value),contactPreference=$('app-preference').value,message=$('app-message').value.trim();
 const status=$('app-status');
 if(name.length<2){status.textContent='Informe seu nome completo.';$('app-name').focus();return;}
 if(phone.length<10||phone.length>13){status.textContent='Informe um número de celular válido com DDD (10 ou 11 dígitos; com código do país, até 13).';$('app-phone').focus();return;}
 if(contactPreference==='E-mail'&&!email){status.textContent='Para receber contato por e-mail, informe seu endereço ou escolha WhatsApp ou ligação.';$('app-email').focus();return;}
 if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){status.textContent='Confira o e-mail informado.';return;}
 if(!$('app-consent').checked){status.textContent='Confirme a autorização para o uso dos seus dados.';return;}
 const button=$('app-submit');button.disabled=true;status.textContent='Enviando candidatura...';
 try{await addDoc(collection(db,'candidaturas'),{jobId:id,jobTitle:job.title,name,email,phone,contactPreference,message,consent:true,stage:'Recebido',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  $('application-form').hidden=true;status.textContent='Candidatura enviada! A equipe poderá entrar em contato por '+(contactPreference==='Ligação'?'ligação':contactPreference==='E-mail'?'e-mail':'WhatsApp')+'.';
 }catch(error){console.warn('Não foi possível enviar candidatura:',error.code||error.message);status.textContent=error.code==='permission-denied'?'Não foi possível enviar. Peça ao administrador para publicar as novas regras do Firestore.':'O envio falhou. Verifique sua conexão e tente novamente.';button.disabled=false;}
});
