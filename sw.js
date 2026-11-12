/* O'QI — oflayn keshi */
const CACHE = "oqi-v8";
const ASSETS = [
  "./",
  "index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/data.js",
  "assets/texts.js",
  "data/texts/gulliverning-sayohatlari.js",
  "assets/oqi-wordmark.png",
  "assets/oqi-icon-192.png",
  "assets/oqi-icon-512.png",
  "assets/oqi-og.png",
  "favicon-32.png",
  "manifest.json",
  "data/books.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // Katalog ma'lumotlari: avval tarmoq (CMS yangilanishi darhol ko'rinsin), keyin kesh
  if (new URL(e.request.url).pathname.endsWith("/data/books.json")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
