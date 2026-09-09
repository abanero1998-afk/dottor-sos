const C = "dottor-sos-v2";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(C).then((c) => c.addAll(["/", "/manifest.json"])));
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copy = r.clone();
        caches.open(C).then((c) => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});
