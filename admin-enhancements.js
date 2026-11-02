// Navigation-only enhancement; no Firebase permissions or new collections.
(()=>{const input=document.getElementById('admin-menu-search');if(!input)return;
const tabs=[...document.querySelectorAll('.admin-tabs .tab')];
input.addEventListener('input',()=>{const term=input.value.trim().toLocaleLowerCase('pt-BR');tabs.forEach(tab=>{tab.hidden=!tab.textContent.toLocaleLowerCase('pt-BR').includes(term)})});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!document.getElementById('admin-panel').hidden){e.preventDefault();input.focus();input.select()}});
})();
