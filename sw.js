/* Contrata Sul — cache exclusivamente de conteúdo público estático.
 * Nunca armazena credenciais, respostas do Firestore ou telas administrativas.
 */
const VERSION = 'cs-mobile-v7-20261107';
const STATIC_ASSETS = [
  './index.html','./styles.css','./visual-refresh.css','./v5-site.css','./v6-premium.css','./script.js','./public-vagas.js','./site-content.js','./media-public.js','./favicon.svg',
  './icons/public-192.png','./icons/public-512.png','./manifest.webmanifest',
  './offline.html'
];
const ASSET_PATHS = new Set(STATIC_ASSETS.map(url => new URL(url,self.registration.scope).pathname));
const PUBLIC_HOME = new URL('./index.html',self.registration.scope).pathname;
const PUBLIC_ROOT = new URL('./',self.registration.scope).pathname;
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(VERSION);
    // Missing optional file must not prevent app install.
    await Promise.all(STATIC_ASSETS.map(async resource=>{
      try { await cache.add(new Request(resource,{cache:'reload'})); }catch(err){ console.warn('Cache público indisponível:',resource); }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>(name.startsWith('cs-public-')||name.startsWith('cs-mobile-'))&&name!==VERSION).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // excludes Firebase, Google API, Analytics, etc.
  const path=url.pathname;
  const isHome=path===PUBLIC_HOME||path===PUBLIC_ROOT;
  const isPrivate=/\/(?:admin|portal-empresa|candidatar)\.html$/i.test(path);
  // Online-only auth pages, user data and dynamic routes: never cache.
  if(isPrivate)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{return await fetch(req)}
      catch{const cache=await caches.open(VERSION);
        if(isHome)return await cache.match('./index.html')||await cache.match('./offline.html');
        return await cache.match('./offline.html')||Response.error();}
    })());
    return;
  }
  // Only explicit, publicly safe application assets. Query params ignored for these known files.
  if(!ASSET_PATHS.has(path))return;
  event.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{
      const response=await fetch(req);
      if(response.ok&&response.type==='basic')await cache.put(req,response.clone());
      return response;
    }catch{return await cache.match(req,{ignoreSearch:true})||Response.error()}
  })());
});
