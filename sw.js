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
    console.log('🔧 Service Worker: Instalando...');
    console.log('📋 Service Worker: Versión - STATIC_CACHE:', STATIC_CACHE, 'DYNAMIC_CACHE:', DYNAMIC_CACHE);
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                console.log('📦 Service Worker: Cacheando App Shell en STATIC_CACHE...');
                return cache.addAll(APP_SHELL_FILES).catch(err => {
                    console.warn('⚠️ Service Worker: Algunos archivos no se pudieron cachear:', err);
                    // Continuar aunque algunos archivos fallen
                });
            }),
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('📦 Service Worker: DYNAMIC_CACHE inicializado para imágenes');
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
    console.log('✅ Service Worker: Activado');
    console.log('📋 Service Worker: Caches activos - STATIC_CACHE:', STATIC_CACHE, 'DYNAMIC_CACHE:', DYNAMIC_CACHE);
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            console.log('📋 Service Worker: Caches encontrados:', cacheNames);
            
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Eliminar caches antiguos (mantener solo STATIC_CACHE y DYNAMIC_CACHE)
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    } else {
                        console.log('✅ Service Worker: Manteniendo cache:', cacheName);
                    }
                })
            );
        }).then(() => {
            // Verificar que los caches estén creados
            return Promise.all([
                caches.open(STATIC_CACHE).then(cache => {
                    console.log('✅ Service Worker: STATIC_CACHE verificado');
                    return cache.keys().then(keys => {
                        console.log('📦 Service Worker: Archivos en STATIC_CACHE:', keys.length);
                    });
                }),
                caches.open(DYNAMIC_CACHE).then(cache => {
                    console.log('✅ Service Worker: DYNAMIC_CACHE verificado');
                    return cache.keys().then(keys => {
                        console.log('🖼️ Service Worker: Imágenes en DYNAMIC_CACHE:', keys.length);
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
    const { request } = event;
    
    // Ignorar peticiones que no sean GET o que sean de extensiones/chrome
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }

    const url = new URL(request.url);
    
    // ============================================
    // 1. ESTRATEGIA PARA IMÁGENES DE FIREBASE STORAGE
    // Cache First: Servir desde caché si está disponible, si no, intentar red
    // Las imágenes se cachean usando mode: 'no-cors' desde main.js
    // ============================================
    if (url.hostname.includes('firebasestorage.googleapis.com')) {
        event.respondWith(
            caches.open(DYNAMIC_CACHE).then(cache => {
                // Primero verificar si está en caché
                return cache.match(request).then(cachedResponse => {
                    if (cachedResponse) {
                        console.log('✅ Service Worker: Imagen servida desde caché:', request.url);
                        return cachedResponse;
                    }
                    
                    // Si NO está en caché, intentar la red
                    // Usar mode: 'no-cors' para evitar problemas de CORS
                    return fetch(request, {
                        mode: 'no-cors'
                    }).then(networkResponse => {
                        // Las respuestas "opaque" (no-cors) siempre tienen status 0, pero se pueden cachear
                        if (networkResponse) {
                            // Cachear la respuesta para la próxima vez
                            const responseToCache = networkResponse.clone();
                            cache.put(request, responseToCache).then(() => {
                                console.log('💾 Service Worker: Imagen cacheada desde red (opaque):', request.url);
                            }).catch(err => {
                                console.warn('⚠️ Service Worker: Error al cachear:', err);
                            });
                        }
                        return networkResponse;
                    }).catch(error => {
                        // Si la red falla, devolver error
                        console.warn('⚠️ Service Worker: Error al cargar imagen:', request.url, error);
                        throw error;
                    });
                });
            }).catch(error => {
                console.error('❌ Service Worker: Error crítico con imagen:', error);
                // Si hay error, intentar fetch normal como último recurso
                return fetch(request);
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
            console.error('❌ Service Worker: Error crítico en fetch:', error);
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




