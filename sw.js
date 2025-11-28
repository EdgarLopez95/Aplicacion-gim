// Cachés separados para diferentes tipos de recursos
const STATIC_CACHE = 'static-v1'; // Para código de la app (html, css, js)
const DYNAMIC_CACHE = 'dynamic-v1'; // Para imágenes de Firebase Storage

// Archivos estáticos de la App Shell (se cachean al instalar)
// Rutas relativas para funcionar en subcarpetas (GitHub Pages)
const APP_SHELL_FILES = [
    './',
    './index.html',
    './css/main.css',
    './css/components.css',
    './css/views.css',
    './js/main.js',
    './js/ui.js',
    './js/storage.js',
    './js/firebase-config.js',
    './manifest.json',
    './images/favicon.png'
];

// URLs de Firebase Storage (imágenes)
const FIREBASE_STORAGE_URL = 'https://firebasestorage.googleapis.com';

// Evento: Instalación del Service Worker
// Cachea los archivos estáticos de la App Shell
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                return cache.addAll(APP_SHELL_FILES).catch(err => {
                    // Continuar aunque algunos archivos fallen
                });
            }),
            caches.open(DYNAMIC_CACHE).then(cache => {
                return cache;
            })
        ])
    );
    
    // Forzar activación inmediata del nuevo service worker
    self.skipWaiting();
});

// Evento: Activación del Service Worker
// Limpia caches antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar caches antiguos (mantener solo STATIC_CACHE y DYNAMIC_CACHE)
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Verificar que los caches estén creados
            return Promise.all([
                caches.open(STATIC_CACHE).then(cache => {
                    return cache.keys().then(keys => {
                        return keys;
                    });
                }),
                caches.open(DYNAMIC_CACHE).then(cache => {
                    return cache.keys().then(keys => {
                        return keys;
                    });
                })
            ]);
        })
    );
    
    // Tomar control inmediato de todas las páginas
    return self.clients.claim();
});

// Evento: Interceptar peticiones
self.addEventListener('fetch', event => {
    // 1. IGNORAR MÉTODOS QUE NO SEAN GET (POST, PUT, DELETE, ETC)
    // Esto es vital para permitir la subida de imágenes a Firebase
    if (event.request.method !== 'GET') {
        return; // Deja que la red maneje estas peticiones
    }
    
    const { request } = event;
    
    // Ignorar peticiones que no sean HTTP/HTTPS (extensiones, chrome://, etc.)
    if (!request.url.startsWith('http')) {
        return;
    }

    const url = new URL(request.url);
    
    // ============================================
    // 1. ESTRATEGIA PARA IMÁGENES DE FIREBASE STORAGE
    // Cache First: Servir desde caché si está disponible, si no, intentar red
    // ============================================
    if (url.hostname.includes('firebasestorage.googleapis.com')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(cache => {
                // Primero verificar si está en caché
                return cache.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        // LOG DE ÉXITO (CACHE)
                        console.log('%c✅ [SW] Imagen desde Caché:', 'color: green; font-weight: bold', request.url);
                        return cachedResponse;
                    }
                    
                    // LOG DE INTENTO (RED)
                    console.log('%c⬇️ [SW] Descargando imagen nueva:', 'color: orange; font-weight: bold', request.url);
                    
                    // Si NO está en caché, intentar la red
                    // Intentar primero con CORS normal
                    return fetch(request).then(networkResponse => {
                        // Si la respuesta es válida y no es opaque, cachearla
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            cache.put(request, responseToCache).then(() => {
                                // LOG DE GUARDADO
                                console.log('%c💾 [SW] Imagen Guardada en Caché:', 'color: blue; font-weight: bold', request.url);
                            }).catch(() => {
                                // Error al cachear, continuar
                            });
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Si falla con CORS normal, intentar con no-cors como fallback
                        return fetch(request, {
                            mode: 'no-cors'
                        }).then(networkResponse => {
                            // Las respuestas "opaque" (no-cors) se pueden cachear pero tienen limitaciones
                            if (networkResponse) {
                                const responseToCache = networkResponse.clone();
                                cache.put(request, responseToCache).then(() => {
                                    // LOG DE GUARDADO (no-cors)
                                    console.log('%c💾 [SW] Imagen Guardada en Caché (no-cors):', 'color: blue; font-weight: bold', request.url);
                                }).catch(() => {
                                    // Error al cachear, continuar
                                });
                            }
                            return networkResponse;
                        }).catch(error => {
                            // LOG DE ERROR
                            console.error('%c❌ [SW] Error descarga:', 'color: red; font-weight: bold', error, request.url);
                            // Si todo falla, lanzar error
                            throw error;
                        });
                    });
                });
            }).catch(error => {
                // LOG DE ERROR CRÍTICO
                console.error('%c❌ [SW] Error crítico en caché:', 'color: red; font-weight: bold', error, request.url);
                // Si hay error crítico, intentar fetch normal como último recurso
                return fetch(request).catch(() => {
                    // Si incluso esto falla, devolver error
                    throw error;
                });
            })
        );
        return; // Terminar aquí para estas peticiones
    }
    
    // ============================================
    // 2. ESTRATEGIA PARA APP SHELL (Código de la app)
    // Stale-While-Revalidate: Usar caché pero actualizar en segundo plano
    // ============================================
    
    // Normalizar rutas para comparar correctamente (eliminar ./ y /)
    const normalizePath = (path) => {
        return path.replace(/^\.\//, '').replace(/^\//, '');
    };
    
    const requestPath = normalizePath(url.pathname);
    const isAppShellFile = APP_SHELL_FILES.some(file => {
        const normalizedFile = normalizePath(file);
        return requestPath === normalizedFile || 
               requestPath === normalizedFile + '/' ||
               requestPath.endsWith('/' + normalizedFile);
    });
    
    // Solo interceptar archivos de la App Shell
    if (!isAppShellFile) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // Si hay caché, devolverlo inmediatamente (Stale-first)
            if (cachedResponse) {
                // Actualizar caché en segundo plano (Stale-While-Revalidate)
                fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(STATIC_CACHE).then(cache => {
                            cache.put(request, responseToCache);
                        });
                    }
                }).catch(() => {
                    // Ignorar errores de red si ya tenemos caché
                });
                return cachedResponse;
            }

            // Si no hay caché, intentar la red
            return fetch(request).then(networkResponse => {
                // Cachear respuesta válida
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Si la red falla y no hay caché, intentar fallback
                // Para documentos HTML, devolver index.html
                if (request.destination === 'document') {
                    return caches.match('./index.html').then(fallbackResponse => {
                        if (fallbackResponse) return fallbackResponse;
                        return caches.match('index.html');
                    }).then(fallbackResponse => {
                        if (fallbackResponse) return fallbackResponse;
                        // Si no hay fallback, devolver una respuesta HTML básica
                        return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/html; charset=utf-8'
                            })
                        });
                    });
                }
                
                // Para otros recursos, devolver una respuesta de error válida
                return new Response('Recurso no disponible offline', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain; charset=utf-8'
                    })
                });
            });
        }).catch(error => {
            // Manejo de errores críticos
            // Intentar devolver index.html como último recurso
            if (request.destination === 'document') {
                return caches.match('./index.html').then(fallbackResponse => {
                    if (fallbackResponse) return fallbackResponse;
                    return caches.match('index.html');
                }).then(fallbackResponse => {
                    if (fallbackResponse) return fallbackResponse;
                    // Respuesta HTML de error como último recurso
                    return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title></head><body><h1>Error</h1><p>No se pudo cargar la aplicación.</p></body></html>', {
                        status: 500,
                        statusText: 'Internal Server Error',
                        headers: new Headers({
                            'Content-Type': 'text/html; charset=utf-8'
                        })
                    });
                });
            }
            // Para otros recursos, devolver error
            return new Response('Error al cargar el recurso', {
                status: 500,
                statusText: 'Internal Server Error',
                headers: new Headers({
                    'Content-Type': 'text/plain; charset=utf-8'
                })
            });
        })
    );
});




