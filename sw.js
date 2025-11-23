const CACHE_NAME = 'gimnasio-app-cache-v2'; // Incrementar versión al actualizar

// Archivos estáticos de la App Shell (se cachean al instalar)
const APP_SHELL_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/components.css',
    '/css/views.css',
    '/js/main.js',
    '/js/ui.js',
    '/js/storage.js',
    '/js/firebase-config.js',
    '/manifest.json',
    '/images/favicon.png'
];

// URLs de Firebase Storage (imágenes)
const FIREBASE_STORAGE_URL = 'https://firebasestorage.googleapis.com';

// Evento: Instalación del Service Worker
// Cachea los archivos estáticos de la App Shell
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 Service Worker: Cacheando App Shell...');
            return cache.addAll(APP_SHELL_FILES).catch(err => {
                console.warn('⚠️ Service Worker: Algunos archivos no se pudieron cachear:', err);
                // Continuar aunque algunos archivos fallen
            });
        })
    );
    
    // Forzar activación inmediata del nuevo service worker
    self.skipWaiting();
});

// Evento: Activación del Service Worker
// Limpia caches antiguos
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activado');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar caches antiguos
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Tomar control inmediato de todas las páginas
    return self.clients.claim();
});

// Evento: Interceptar peticiones
// Estrategia: Stale-While-Revalidate (Rápido, pero se actualiza en segundo plano)
self.addEventListener('fetch', event => {
    // Solo nos interesan las peticiones GET (no POST, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    
    // 1. Archivos estáticos de la App Shell (HTML, CSS, JS)
    const isAppShellFile = APP_SHELL_FILES.some(file => {
        const path = url.pathname;
        return path === file || path === file + '/';
    });
    
    // 2. Imágenes de Firebase Storage
    const isFirebaseImage = event.request.url.startsWith(FIREBASE_STORAGE_URL);

    if (isAppShellFile || isFirebaseImage) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    // 1. (Stale) Devuelve la versión de la caché (rápido)
                    if (cachedResponse) {
                        // 2. (While-Revalidate) Pide la nueva versión en segundo plano
                        fetch(event.request).then(networkResponse => {
                            // Si la respuesta es buena, la guardamos en caché para la próxima vez
                            if (networkResponse.ok) {
                                cache.put(event.request, networkResponse.clone());
                            }
                        }).catch(() => {
                            // Si falla la red, ignoramos el error (ya tenemos la caché)
                        });
                        
                        return cachedResponse;
                    }
                    
                    // Si no hay caché, intenta la red
                    return fetch(event.request).then(networkResponse => {
                        // Si la respuesta es buena, la guardamos en caché
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Si falla la red y no hay caché, devuelve una respuesta offline básica
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
                });
            })
        );
    }
});




