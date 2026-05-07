// reps service worker (static export)
const VERSION = "v2";
const CACHE = `reps-${VERSION}`;
const SCOPE = new URL("./", self.location.href).pathname;
const SHELL = [
  SCOPE,
  `${SCOPE}offline/`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}icon.svg`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(SHELL.map((u) => cache.add(u)));
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok && (req.mode === "navigate" || url.pathname.startsWith(`${SCOPE}_next/`))) {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        const hit = await cache.match(req);
        if (hit) return hit;
        if (req.mode === "navigate") {
          const offline = await cache.match(`${SCOPE}offline/`);
          if (offline) return offline;
        }
        throw new Error("offline");
      }
    })(),
  );
});
