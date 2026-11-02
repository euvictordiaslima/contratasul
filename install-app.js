/* Instalador compartilhado. Funciona em Chrome/Edge e mostra instruções para iOS. */
(()=>{
 'use strict';
 if('serviceWorker' in navigator && window.isSecureContext){
   window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(e=>console.warn('Aplicativo não registrado:',e.message)),{once:true});
 }
 let installEvent=null;
 const button=document.getElementById('install-app');
 const dialog=document.getElementById('install-help');
 const feedback=document.getElementById('connectivity-status');
 const alreadyInstalled=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const isiOS=/iP(?:ad|hone|od)/.test(navigator.userAgent);
 const isMobile=isiOS || /Android|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints>1 && /Macintosh/.test(navigator.userAgent));
 function refresh(){
  if(button)button.hidden=alreadyInstalled()||!isMobile;
  if(feedback){
   feedback.hidden=navigator.onLine;
   feedback.textContent='Sem conexão. Consulta de vagas, login e candidaturas exigem internet.';
  }
 }
 window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installEvent=event;refresh();
 });
 window.addEventListener('appinstalled',()=>{installEvent=null;refresh();});
 window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
 function instructions(){
   if(!dialog)return;
   const details=dialog.querySelector('[data-install-instructions]');
   if(details){details.textContent=isiOS
    ? 'No iPhone ou iPad: toque em Compartilhar e escolha “Adicionar à Tela de Início”. Depois, confirme “Adicionar”.'
    : 'No Android: abra o menu do Chrome e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.';}
   if(typeof dialog.showModal==='function')dialog.showModal();
   else window.alert(details?.textContent||'Use o menu do navegador para instalar.');
 }
 if(button)button.addEventListener('click',async()=>{
   if(alreadyInstalled()||!isMobile)return;
   if(installEvent){const prompt=installEvent;installEvent=null;
     try {await prompt.prompt();await prompt.userChoice;} catch(e){console.warn('Instalação indisponível:',e.message)}
     refresh();
   }else instructions();
 });
 if(dialog){dialog.querySelector('[data-close-install]')?.addEventListener('click',()=>dialog.close());
   dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});}
 refresh();
})();
