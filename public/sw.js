const C = "dottor-sos-v3";
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(C).then((c) => c.addAll(["/", "/manifest.json", "/logo.svg"]))
  );
  self.skipWaiting();
});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const u = e.request.url;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (e.request.method === "GET" && r.ok) {
          const copy = r.clone();
          caches.open(C).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("/")))
  );
});
