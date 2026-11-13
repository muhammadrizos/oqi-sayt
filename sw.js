/* O'QI — oflayn keshi */
const CACHE = "oqi-v9";
const ASSETS = [
  "./",
  "index.html",
  "assets/styles.css",
  "assets/app.js",
  "assets/data.js",
  "assets/texts.js",
  "data/books.json",
  "data/texts/baxtli-shahzoda.md",
  "data/texts/oliver-tvist.md",
  "data/texts/alisa.md",
  "data/texts/robinzon.md",
  "data/texts/gulliverning-sayohatlari.md",
  "assets/oqi-wordmark.png",
  "assets/oqi-icon-192.png",
  "assets/oqi-icon-512.png",
  "assets/oqi-og.png",
  "favicon-32.png",
  "manifest.json"
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

  const path = new URL(e.request.url).pathname;

  // Admin panel hech qachon keshlanmasin (Decap yangilanishlari darhol ko'rinsin)
  if (path.startsWith("/admin")) return;

  // Katalog va matnlar: avval tarmoq (CMS yangilanishi darhol ko'rinsin), keyin kesh
  if (path.endsWith("/data/books.json") || path.includes("/data/texts/")) {
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
