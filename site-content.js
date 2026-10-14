import {getApps,initializeApp,getApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getFirestore,doc,onSnapshot} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app);
onSnapshot(doc(db,'configuracoes','site'),snapshot=>{if(!snapshot.exists())return;const data=snapshot.data();const area=document.getElementById('managed-site-info');if(!area)return;area.replaceChildren();const h=document.createElement('h3'),p=document.createElement('p'),a=document.createElement('a');h.textContent=data.title||'Entre em contato';p.textContent=data.description||'';a.textContent='Falar com a equipe →';a.href='https://wa.me/'+String(data.whatsapp||'').replace(/\D/g,'');a.target='_blank';a.rel='noopener noreferrer';area.append(h,p,a)},()=>{});
