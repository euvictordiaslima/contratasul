import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {firebaseConfig} from './firebase-config.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,collection,addDoc,updateDoc,getDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app=getApps()[0]||initializeApp(firebaseConfig);
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
const state={items:[],authorized:false,unsubscribe:null};
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const plain=(tag,value='',className='')=>{const n=document.createElement(tag);n.textContent=value;n.className=className;return n;};
const msg=value=>{$('media-message').textContent=value;};
function safeUrl(raw,required=false){
 const v=String(raw||'').trim();if(!v){if(required)throw Error('Informe a URL da imagem.');return '';}
 let url;try{url=new URL(v);}catch{throw Error('URL inválida. Use um endereço HTTPS completo.');}
 if(url.protocol!=='https:'||!url.hostname||v.length>1200||url.username||url.password)throw Error('Use apenas URL HTTPS sem credenciais.');
 return url.href;
}
function loadPreview(){const parent=$('media-preview');parent.replaceChildren();try{const url=safeUrl($('media-image').value,true);const img=plain('img');img.src=url;img.alt='Prévia da imagem';img.referrerPolicy='no-referrer';img.loading='lazy';img.onerror=()=>{parent.replaceChildren(plain('span','Não foi possível carregar esta imagem. Confira a URL ou as permissões do servidor.'));};parent.append(img);}catch{parent.append(plain('span','A prévia aparecerá aqui ao informar uma URL HTTPS válida.'));}}
$('media-image').addEventListener('change',loadPreview);
$('media-image').addEventListener('blur',loadPreview);
function clear(){ $('media-form').reset();$('media-edit-id').value='';$('media-form-title').textContent='Adicionar imagem';$('media-save').textContent='Salvar imagem';$('media-preview').replaceChildren(plain('span','A prévia aparecerá aqui ao informar uma URL válida.')); }
$('media-clear').addEventListener('click',clear);
function render(){
 const items=state.items;
 $('media-banners-count').textContent=items.filter(m=>m.type==='banner').length;
 $('media-materials-count').textContent=items.filter(m=>m.type==='material').length;
 $('media-active-count').textContent=items.filter(m=>m.active).length;
 const term=norm($('media-search').value),filter=$('media-filter').value;
 const rows=items.filter(m=>(filter==='all'||m.type===filter)&&norm([m.title,m.imageUrl,m.description,m.linkUrl].join(' ')).includes(term)).sort((a,b)=>(a.order||0)-(b.order||0)||String(a.title).localeCompare(String(b.title),'pt-BR'));
 $('media-count').textContent=`${rows.length} de ${items.length} imagem(ns)`;
 const root=$('media-list');root.replaceChildren();
 for(const item of rows.slice(0,150)){
  const row=plain('div','','media-admin-item');
  const image=plain('img');image.src=item.imageUrl;image.alt=item.title;image.referrerPolicy='no-referrer';image.loading='lazy';image.onerror=()=>{image.hidden=true};
  const content=plain('div','','media-item-content');content.append(plain('strong',item.title),plain('small',`${item.type==='banner'?'Propaganda':'Material'} · ${item.active?'Publicado':'Oculto'} · Ordem ${item.order||0}`));
  const buttons=plain('div','','media-item-actions');
  const edit=plain('button','Editar','secondary');edit.type='button';edit.addEventListener('click',()=>{for(const [id,value] of Object.entries({'media-edit-id':item.id,'media-type':item.type,'media-title':item.title,'media-image':item.imageUrl,'media-link':item.linkUrl||'','media-description':item.description||'','media-order':String(item.order||0),'media-active':String(!!item.active)}))$(id).value=value;$('media-form-title').textContent='Editar imagem';$('media-save').textContent='Salvar alterações';loadPreview();$('media-form').scrollIntoView({behavior:'smooth',block:'start'});});
  const toggle=plain('button',item.active?'Ocultar':'Publicar','secondary');toggle.type='button';toggle.addEventListener('click',async()=>{if(!state.authorized)return;toggle.disabled=true;try{await updateDoc(doc(db,'midia_site',item.id),{active:!item.active,updatedAt:serverTimestamp()});msg('Situação atualizada.');}catch(e){msg('Não foi possível atualizar: '+(e.code||e.message));}finally{toggle.disabled=false}});
  const remove=plain('button','Excluir','danger');remove.type='button';remove.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('admin-request-delete',{detail:{collection:'midia_site',id:item.id,label:item.title}})));
  buttons.append(edit,toggle,remove);row.append(image,content,buttons);root.append(row);
 }
 if(!rows.length)root.append(plain('p','Nenhuma imagem encontrada. Use o formulário para publicar a primeira imagem.'));
 if(rows.length>150)root.append(plain('p','Mostrando 150 registros. Use a pesquisa para localizar os demais.'));
}
$('media-search').addEventListener('input',render);$('media-filter').addEventListener('change',render);
$('media-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!state.authorized){msg('Entre com uma conta administrativa autorizada.');return;}
 const button=$('media-save');button.disabled=true;
 try{
  const type=$('media-type').value, title=$('media-title').value.trim(),description=$('media-description').value.trim(), order=Number($('media-order').value),active=$('media-active').value==='true';
  if(!['banner','material'].includes(type)||!title||title.length>100||description.length>240||!Number.isInteger(order)||order<0||order>999)throw Error('Confira o título, tipo, descrição e ordem.');
  const imageUrl=safeUrl($('media-image').value,true),linkUrl=safeUrl($('media-link').value);
  const item={type,title,imageUrl,linkUrl,description,order,active,updatedAt:serverTimestamp()};
  const id=$('media-edit-id').value;
  if(id){const current=await getDoc(doc(db,'midia_site',id));if(!current.exists())throw Error('Imagem não encontrada.');await updateDoc(doc(db,'midia_site',id),item);}
  else await addDoc(collection(db,'midia_site'),{...item,createdAt:serverTimestamp()});
  clear();msg('Imagem salva. Os carrosséis serão atualizados automaticamente no site público.');
 }catch(e){msg('Não foi possível salvar: '+(e.code||e.message))}finally{button.disabled=false;}
});
onAuthStateChanged(auth,async user=>{
 state.unsubscribe?.();state.unsubscribe=null;state.authorized=false;state.items=[];render();
 if(!user)return;
 try{
  const record=await getDoc(doc(db,'admins',user.uid));if(!record.exists()||record.data().active!==true)return;
  state.authorized=true;
  state.unsubscribe=onSnapshot(collection(db,'midia_site'),snapshot=>{state.items=snapshot.docs.map(d=>({id:d.id,...d.data()}));render();},error=>msg('Não foi possível carregar imagens: '+(error.code||error.message)));
 }catch(e){msg('Não foi possível confirmar acesso: '+(e.code||e.message));}
});
