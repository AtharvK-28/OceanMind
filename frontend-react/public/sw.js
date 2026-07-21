// OceanMind service worker.
//  - API calls (fisher-critical): network-first, fall back to last cached
//    response so the Fisher View still shows recent data offline.
//  - Map tiles: cache-first, so the map keeps rendering the areas the fisher
//    has already viewed even with no signal at sea.
const CACHE_NAME = "oceanmind-v2";
const TILE_CACHE = "oceanmind-tiles-v1";
const MAX_TILES = 400;

const CACHEABLE_PATH_FRAGMENTS = [
  "/api/v1/sfz/current",
  "/api/v1/mhi/status",
  "/api/v1/trace/chain-summary",
  "/api/v1/trace/history",
  "/api/v1/compliance/status",
];

const KEEP_CACHES = [CACHE_NAME, TILE_CACHE];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP_CACHES.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheableApiRequest(url) {
  return CACHEABLE_PATH_FRAGMENTS.some((fragment) => url.pathname.includes(fragment));
}

function isMapTile(url) {
  // CartoDB basemap tiles used by Leaflet (see LeafletMap.tsx TileLayer url).
  return url.hostname.endsWith("basemaps.cartocdn.com");
}

async function trimCache(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) {
    // Cache API keys() preserves insertion order → delete the oldest first.
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Map tiles — cache-first (opaque cross-origin responses cache fine)
  if (isMapTile(url)) {
    event.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.type !== "error") {
            cache.put(req, res.clone()).then(() => trimCache(cache, MAX_TILES));
          }
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Fisher-critical API — network-first with cached fallback
  if (isCacheableApiRequest(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: "offline", cached: false }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
  }
});
