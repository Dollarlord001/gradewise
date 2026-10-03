const CACHE_PREFIX = "tutor-me-shell-v";
const CACHE_NAME = `${CACHE_PREFIX}1`;
const SHELL = "/cbt";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const update = fetch(request).then(async (response) => { if (response.ok) { try { await cache.put(request, response.clone()); } catch { /* A full cache must not interrupt the current page load. */ } } return response; });
      return cached ?? update;
    }));
  } else if (request.mode === "navigate" && url.pathname === SHELL) {
    event.respondWith(fetch(request).then(async (response) => { if (response.ok) { try { await caches.open(CACHE_NAME).then((cache) => cache.put(SHELL, response.clone())); } catch { /* Keep navigation working if storage quota is exhausted. */ } } return response; }).catch(async () => (await caches.match(SHELL)) ?? Response.error()));
  }
});
