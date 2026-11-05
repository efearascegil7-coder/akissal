const CACHE="akissal-v2";

self.addEventListener("install",e=>{
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll([
      "./","./index.html","./style.css","./app.js",
      "./manifest.webmanifest","./icon.svg"
    ]))
  );
});

self.addEventListener("activate",e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",e=>{
  if(e.request.method==="GET"&&new URL(e.request.url).origin===location.origin){
    e.respondWith(
      fetch(e.request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(c=>c.put(e.request,copy));
        }
        return response;
      }).catch(()=>caches.match(e.request))
    );
  }
});
