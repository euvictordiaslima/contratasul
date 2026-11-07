import {getApps,initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,getDocsFromServer} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {getStorage,ref,getBlob} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import {firebaseConfig} from './firebase-config.js';
const app=getApps()[0]||initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
const button=document.getElementById('resume-backup'),status=document.getElementById('resume-backup-status');
const text=value=>{status.textContent=value;};
const validPath=path=>/^curriculos\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}\/curriculo\.(pdf|docx)$/.test(path||'');
const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const cleanName=value=>normalize(value).replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||'candidato';
const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
const encoder=new TextEncoder();
function dosDateTime(date){return {time:(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),date:((Math.max(1980,date.getFullYear())-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()};}
// ZIP sem compressão; não usa bibliotecas externas nem transfere arquivos para outros serviços.
function makeZip(entries){
 const local=[],central=[];let offset=0,centralSize=0;
 const now=dosDateTime(new Date());
 for(const {name,bytes} of entries){
  const filename=encoder.encode(name),size=bytes.length,crc=crc32(bytes);
  if(filename.length>255||size>0xffffffff)throw Error('Arquivo grande demais para o ZIP.');
  const header=new Uint8Array(30),v=new DataView(header.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(8,0,true);
  v.setUint16(10,now.time,true);v.setUint16(12,now.date,true);v.setUint32(14,crc,true);v.setUint32(18,size,true);v.setUint32(22,size,true);v.setUint16(26,filename.length,true);
  local.push(header,filename,bytes);
  const ch=new Uint8Array(46),cv=new DataView(ch.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);
  cv.setUint16(12,now.time,true);cv.setUint16(14,now.date,true);cv.setUint32(16,crc,true);cv.setUint32(20,size,true);cv.setUint32(24,size,true);
  cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);
  central.push(ch,filename);centralSize+=ch.length+filename.length;
  offset+=header.length+filename.length+size;
 }
 const end=new Uint8Array(22),ev=new DataView(end.buffer);
 ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);
 ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 return new Blob([...local,...central,end],{type:'application/zip'});
}
button?.addEventListener('click',async()=>{
 button.disabled=true;text('Verificando acesso administrativo...');
 try{
  const user=auth.currentUser;if(!user)throw Error('Faça login no painel.');
  const admin=await getDoc(doc(db,'admins',user.uid));
  if(!admin.exists()||admin.data().active!==true)throw Error('Acesso restrito ao administrador.');
  const snapshot=await getDocsFromServer(collection(db,'candidaturas'));
  const term=normalize(document.getElementById('candidate-search')?.value||'');
  const rows=snapshot.docs.map(item=>({id:item.id,...item.data()}))
   .filter(c=>validPath(c.resumePath)&&normalize([c.name,c.jobTitle,c.phone,c.email].join(' ')).includes(term));
  if(!rows.length)throw Error('Nenhum currículo encontrado para a pesquisa atual.');
  if(rows.length>100)throw Error('Há mais de 100 currículos. Use a pesquisa para exportar por partes.');
  const total=rows.reduce((sum,c)=>sum+(Number(c.resumeSize)||0),0);
  if(total>150*1024*1024)throw Error('Lote acima de 150 MB. Refine a pesquisa e exporte por partes.');
  const entries=[],failures=[];
  for(let i=0;i<rows.length;i++){
   const c=rows[i];text(`Baixando currículo ${i+1} de ${rows.length}...`);
   try{
    const blob=await getBlob(ref(storage,c.resumePath));
    const bytes=new Uint8Array(await blob.arrayBuffer());
    const ext=c.resumePath.endsWith('.docx')?'docx':'pdf';
    entries.push({name:`${cleanName(c.name)}-${c.id}.${ext}`,bytes});
   }catch(error){failures.push(c.id);console.warn('Currículo não exportado:',c.id,error.code);}
  }
  if(!entries.length)throw Error('Não foi possível baixar nenhum currículo. Confira as regras do Storage e o CORS.');
  text('Montando arquivo ZIP...');
  const zip=makeZip(entries),url=URL.createObjectURL(zip),a=document.createElement('a');
  a.href=url;a.download=`contrata-sul-curriculos-${new Date().toISOString().slice(0,10)}.zip`;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
  text(`${entries.length} currículo(s) exportado(s). ${failures.length?failures.length+' arquivo(s) falharam; revise os registros.':''} Guarde o ZIP com acesso restrito.`);
 }catch(error){text(error.message||'Falha ao exportar currículos.');}
 finally{button.disabled=false;}
});
