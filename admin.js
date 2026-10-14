import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,getDoc,onSnapshot,addDoc,updateDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);let unsub=null,jobs=[];
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
    status('Usuário não cadastrado. Use Beto ou o e-mail do Firebase Authentication.');return;
   }
   const configured=String(window.CONTRATA_SUL_ADMIN_EMAIL || '').trim();
   if(configured && configured.includes('@')){
    email=configured;
   }else{
    try{
     const alias=await getDoc(doc(db,'loginAliases','beto'));
     if(!alias.exists() || !alias.data().email){
      status('O usuário Beto ainda não foi vinculado ao e-mail do Firebase. Entre usando o e-mail cadastrado no Authentication ou execute a configuração inicial.');return;
     }
     email=alias.data().email;
    }catch(error){
     status('Não foi possível consultar o apelido Beto. Entre usando o e-mail cadastrado no Authentication.');return;
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
onAuthStateChanged(auth,async user=>{if(unsub){unsub();unsub=null} $('admin-panel').hidden=true;$('login-panel').hidden=true;clear();if(!user){$('login-panel').hidden=false;return}try{const marker=await getDoc(doc(db,'admins',user.uid));if(!marker.exists()||marker.data().active!==true){status('Esta conta não possui permissão de administrador.');await signOut(auth);return} $('admin-panel').hidden=false;status('Acesso autorizado.');unsub=onSnapshot(collection(db,'vagas'),snapshot=>{jobs=snapshot.docs.map(d=>({id:d.id,...d.data()}));render()},error=>status('Erro ao consultar vagas: '+error.code))}catch(e){status('Não foi possível verificar a autorização: '+e.code);await signOut(auth)}});
function render(){const box=$('vacancies');box.replaceChildren();$('count').textContent='('+jobs.length+')';if(!jobs.length){box.append(el('p','Nenhuma vaga cadastrada.'));return}for(const j of jobs){const row=document.createElement('article');row.className='vacancy';row.append(el('h3',j.title),el('p',[j.company,j.location,j.mode].filter(Boolean).join(' · ')),el('span',j.published?'Publicada':'Rascunho'));row.lastChild.className='status-tag';const actions=document.createElement('div');actions.className='actions';const edit=el('button','Editar'),toggle=el('button',j.published?'Encerrar publicação':'Publicar');toggle.className='secondary';edit.addEventListener('click',()=>{for(const key of ['title','company','location','mode','contract','salary','description'])$(key).value=j[key]||'';$('published').checked=!!j.published;$('vacancy-id').value=j.id;$('form-heading').textContent='Editar vaga';$('vacancy-form').scrollIntoView({behavior:'smooth'});});toggle.addEventListener('click',async()=>{if(!confirm((j.published?'Encerrar':'Publicar')+' esta vaga?'))return;try{await updateDoc(doc(db,'vagas',j.id),{published:!j.published,updatedAt:serverTimestamp()});status('Situação atualizada.')}catch(e){status('Erro ao atualizar: '+e.code)}});actions.append(edit,toggle);row.append(actions);box.append(row)}}
$('vacancy-form').addEventListener('submit',async e=>{e.preventDefault();const data={};for(const key of ['title','company','location','mode','contract','salary','description'])data[key]=$(key).value.trim();data.published=$('published').checked;const id=$('vacancy-id').value;const btn=$('save-button');btn.disabled=true;try{if(id){await updateDoc(doc(db,'vagas',id),{...data,updatedAt:serverTimestamp()})}else{await addDoc(collection(db,'vagas'),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}clear();status('Vaga salva com sucesso.')}catch(e){status('Não foi possível salvar: '+e.code)}finally{btn.disabled=false}});
