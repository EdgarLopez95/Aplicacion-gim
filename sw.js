const CACHE_NAME = 'gimnasio-app-cache-v1';

const CACHE_URLS = [
    // URLs de las imágenes de Firebase Storage
    'https://firebasestorage.googleapis.com'
];

// Estrategia: Stale-While-Revalidate (Rápido, pero se actualiza en segundo plano)
self.addEventListener('fetch', event => {
    // Solo nos interesan las peticiones GET (no POST, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    // Solo nos interesan las URLs que queremos cachear (las de Firebase Storage)
    const isCacheable = CACHE_URLS.some(url => event.request.url.startsWith(url));

    if (isCacheable) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    // 1. (Stale) Devuelve la versión de la caché (rápido)
                    const cachedResponse = response;

                    // 2. (While-Revalidate) Pide la nueva versión en segundo plano
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // Si la respuesta es buena, la guardamos en caché para la próxima vez
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });

                    // Devuelve lo que tengamos más rápido (la caché si existe, o la red si no)
                    return cachedResponse || fetchPromise;
                });
            })
        );
    }
});




