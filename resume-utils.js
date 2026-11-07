/* Currículos pequenos no Firestore (Spark), sem Firebase Storage.
 * ATENÇÃO: dados binários são privados; somente administradores podem lê-los.
 * Firestore não é um repositório ideal para arquivos grandes. */
export const MAX_RESUME_BYTES = 700 * 1024;
export const MIME = Object.freeze({pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
export function formatResumeSize(bytes){return (bytes/1024).toLocaleString('pt-BR',{maximumFractionDigits:0})+' KB';}
export async function validateResume(file){
 if(!file)throw Error('Anexe seu currículo para continuar.');
 const ext=String(file.name||'').split('.').pop().toLowerCase();
 if(!Object.hasOwn(MIME,ext))throw Error('Envie seu currículo em PDF ou DOCX.');
 if(file.size<100||file.size>MAX_RESUME_BYTES)throw Error('O currículo deve ter até 700 KB. Escolha um PDF ou DOCX menor para continuar.');
 const sig=new Uint8Array(await file.slice(0,1024).arrayBuffer());
 // O cabeçalho PDF pode estar deslocado dentro dos primeiros 1024 bytes.
 const pdfHeader=()=>{for(let i=0;i+5<=sig.length;i++){if(sig[i]===37&&sig[i+1]===80&&sig[i+2]===68&&sig[i+3]===70&&sig[i+4]===45)return true;}return false;};
 if(ext==='pdf'&&!pdfHeader())throw Error('O arquivo não parece ser um PDF válido.');
 if(ext==='docx'&&!(sig[0]===0x50&&sig[1]===0x4b&&sig[2]===0x03&&sig[3]===0x04))throw Error('O arquivo não parece ser um DOCX válido.');
 return {ext,type:MIME[ext],size:file.size,name:String(file.name).replace(/[<>:"/\\|?*\x00-\x1f]/g,'').slice(0,120)};
}
export function encodeBytes(bytes){
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(binary);
}
export async function encodeResume(file){
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length>MAX_RESUME_BYTES||bytes.length<100)throw Error('Currículo fora do limite permitido.');
 return encodeBytes(bytes);
}
export function decodeResume(record){
 if(!record||record.fileSize<100||record.fileSize>MAX_RESUME_BYTES||typeof record.contentBase64!=='string'||record.contentBase64.length>960000)throw Error('Dados do currículo inválidos.');
 const binary=atob(record.contentBase64);if(binary.length!==record.fileSize)throw Error('Arquivo incompleto.');
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 if(record.fileType===MIME.pdf){if(!String.fromCharCode(...bytes.subarray(0,1024)).includes('%PDF-'))throw Error('PDF inválido.');}
 else if(record.fileType===MIME.docx){if(bytes[0]!==0x50||bytes[1]!==0x4b||bytes[2]!==0x03||bytes[3]!==0x04)throw Error('DOCX inválido.');}
 else throw Error('Tipo de currículo não permitido.');
 return bytes;
}
export function safeResumeName(name,type){
 const ext=type===MIME.docx?'docx':'pdf';
 const clean=String(name||'curriculo').replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,110);
 return clean.toLowerCase().endsWith('.'+ext)?clean:clean+'.'+ext;
}
export function saveResume(bytes,name,type){
 const blob=new Blob([bytes],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=safeResumeName(name,type);document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
