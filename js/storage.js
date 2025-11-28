// storage.js - Lógica de Firebase (Firestore y Storage)

import { db, storage } from './firebase-config.js';
import { obtenerUsuarioActual } from './userSession.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    getDocsFromCache,
    getDocFromCache,
    getDocsFromServer,
    getDocFromServer,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ============================================
// FUNCIONES HELPER PARA OFFLINE-FIRST
// ============================================

/**
 * Intenta obtener datos de la caché primero (rápido), luego de la red si es necesario
 * Esto hace que la app sea instantánea cuando está offline
 */
export async function getDocsCacheFirst(queryRef) {
    // Verificar si estamos online
    const isOnline = navigator.onLine;
    
    try {
        // SIEMPRE intentar primero desde caché (instantáneo, incluso si está online)
        const cacheSnapshot = await getDocsFromCache(queryRef);
        if (cacheSnapshot && !cacheSnapshot.empty) {
            // Si hay datos en caché, devolverlos inmediatamente
            // Si está online, actualizar en segundo plano
            if (isOnline) {
                getDocsFromServer(queryRef).catch(() => {
                    // Ignorar errores de actualización en segundo plano
                });
            }
            return cacheSnapshot;
        }
    } catch (error) {
        // Si no hay caché, continuar
    }
    
    // Si no hay caché y estamos online, intentar desde la red
    if (isOnline) {
        try {
            return await getDocsFromServer(queryRef);
        } catch (error) {
            // Si la red falla, intentar caché de nuevo como fallback
            try {
                return await getDocsFromCache(queryRef);
            } catch (cacheError) {
                throw error;
            }
        }
    }
    
    // Si estamos offline y no hay caché, devolver snapshot vacío
    // Esto evita que la app se quede "pensando" esperando la red
    // Crear un snapshot vacío con la estructura correcta
    const emptySnapshot = {
        empty: true,
        size: 0,
        docs: [],
        forEach: function(callback) {
            // No hacer nada, es un snapshot vacío
        },
        docChanges: function() {
            return [];
        },
        metadata: {
            fromCache: true,
            hasPendingWrites: false
        },
        query: queryRef
    };
    return emptySnapshot;
}

/**
 * Intenta obtener un documento de la caché primero, luego de la red
 */
export async function getDocCacheFirst(docRef) {
    // Verificar si estamos online
    const isOnline = navigator.onLine;
    
    try {
        // SIEMPRE intentar primero desde caché (instantáneo, incluso si está online)
        const cacheDoc = await getDocFromCache(docRef);
        if (cacheDoc && cacheDoc.exists()) {
            // Si hay datos en caché, devolverlos inmediatamente
            // Si está online, actualizar en segundo plano
            if (isOnline) {
                getDocFromServer(docRef).catch(() => {
                    // Ignorar errores de actualización en segundo plano
                });
            }
            return cacheDoc;
        }
    } catch (error) {
        // Si no hay caché, continuar
    }
    
    // Si no hay caché y estamos online, intentar desde la red
    if (isOnline) {
        try {
            return await getDocFromServer(docRef);
        } catch (error) {
            // Si la red falla, intentar caché de nuevo como fallback
            try {
                return await getDocFromCache(docRef);
            } catch (cacheError) {
                throw error;
            }
        }
    }
    
    // Si estamos offline y no hay caché, devolver documento que no existe
    // Esto evita que la app se quede "pensando" esperando la red
    return {
        exists: () => false,
        data: () => undefined,
        id: docRef.id
    };
}

// ============================================
// HELPER DE RUTAS DINÁMICAS POR USUARIO
// ============================================

/**
 * Función auxiliar para obtener la ruta de la colección según el usuario activo
 * @param {string} collectionName - Nombre de la colección
 * @returns {string} Ruta completa de la colección/documento
 */
function getCollectionPath(collectionName) {
    const userId = obtenerUsuarioActual();
    
    // Si no hay usuario (ej: pantalla de login), retornamos null o lanzamos error según prefieras,
    // pero para evitar errores en carga inicial, si no hay user, devolvemos la colección raíz (temporalmente)
    // o manejamos el error.
    if (!userId) {
        console.warn("No hay usuario activo, usando ruta pública temporal o fallando.");
        // Opcional: throw new Error("Usuario no autenticado");
        return collectionName; 
    }

    // Prefijo base para todo: usuarios/{userId}
    const userBasePath = `usuarios/${userId}`;

    // Mapeo de colecciones a rutas privadas
    switch (collectionName) {
        // Biblioteca y Categorías (AHORA SON PRIVADAS TAMBIÉN)
        case 'categoriasMusculares':
            return `${userBasePath}/categoriasMusculares`;

        case 'bibliotecaEjercicios':
            return `${userBasePath}/bibliotecaEjercicios`;

        // Datos de Entreno y Progreso
        case 'entrenos':
            return `${userBasePath}/entrenos`;

        case 'historialDias':
            return `${userBasePath}/historialDias`;

        case 'historialCorporal':
            return `${userBasePath}/historialCorporal`;

        // Documento de Perfil
        case 'mi_perfil': 
            // Nota: Esto devolverá la ruta al DOCUMENTO específico
            return `${userBasePath}/perfil/datos`; 

        default:
            // Por defecto, meter cualquier otra cosa dentro del usuario también
            return `${userBasePath}/${collectionName}`;
    }
}

// Función para cargar entrenos desde Firestore
export async function cargarEntrenos() {
    try {
        const entrenosCollection = collection(db, getCollectionPath('entrenos'));
        const snapshot = await getDocsCacheFirst(entrenosCollection);
        
        if (snapshot.empty) {
            return null;
        }
        
        const entrenos = [];
        snapshot.forEach(docSnapshot => {
            entrenos.push({
                id: docSnapshot.data().id, // ID numérico para compatibilidad
                firestoreId: docSnapshot.id, // ID del documento de Firestore (alfanumérico)
                nombre: docSnapshot.data().nombre,
                imagen: docSnapshot.data().imagen,
                descripcion: docSnapshot.data().descripcion
            });
        });
        
        // Ordenar por ID para mantener el orden
        entrenos.sort((a, b) => a.id - b.id);
        
        return entrenos;
    } catch (error) {
        throw error;
    }
}

// Función para actualizar el nombre de un entreno
export async function actualizarNombreEntreno(entrenoId, nuevoNombre) {
    try {
        const entrenos = await cargarEntrenos();
        if (!entrenos) {
            throw new Error('No se pudieron cargar los entrenos');
        }
        
        const entreno = entrenos.find(e => e.id === entrenoId);
        if (!entreno) {
            throw new Error(`Entreno con ID ${entrenoId} no encontrado`);
        }
        
        const entrenoRef = doc(db, getCollectionPath('entrenos'), entreno.firestoreId);
        await updateDoc(entrenoRef, {
            nombre: nuevoNombre
        });
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para subir imagen a Firebase Storage y obtener URL
export async function subirImagenAStorage(entrenoId, ejercicioId, archivo) {
    try {
        // Validar tamaño del archivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (archivo.size > maxSize) {
            throw new Error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
        }
        
        // Crear referencia en Storage
        const fileName = `${ejercicioId}_${Date.now()}_${archivo.name}`;
        const storageRef = ref(storage, `images/${entrenoId}/${fileName}`);
        
        // Subir el archivo
        await uploadBytes(storageRef, archivo);
        
        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    } catch (error) {
        throw error;
    }
}

// Función auxiliar para extraer la ruta del archivo de una URL de Firebase Storage
function extraerRutaDeStorageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }
    
    // Verificar que sea una URL de Firebase Storage
    if (!imageUrl.includes('firebasestorage') && !imageUrl.includes('googleapis.com')) {
        return null;
    }
    
    try {
        // Intentar extraer la ruta de diferentes formatos de URL de Firebase Storage
        // Formato 1: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
        // Formato 2: https://storage.googleapis.com/bucket/path/to/file
        
        let path = null;
        
        // Formato 1: buscar '/o/' que es el separador en Firebase Storage URLs
        if (imageUrl.includes('/o/')) {
            const urlParts = imageUrl.split('/o/');
            if (urlParts.length >= 2) {
                const pathWithParams = urlParts[1].split('?')[0];
                path = decodeURIComponent(pathWithParams);
            }
        } 
        // Formato 2: buscar después del nombre del bucket
        else if (imageUrl.includes('googleapis.com')) {
            // Extraer el path después del bucket name
            const match = imageUrl.match(/\/[^\/]+\/(.+?)(?:\?|$)/);
            if (match && match[1]) {
                path = decodeURIComponent(match[1]);
            }
        }
        
        return path;
    } catch (error) {
        return null;
    }
}

// Función para eliminar imagen de Firebase Storage
async function eliminarImagenDeStorage(imageUrl) {
    try {
        // Verificar si hay una URL válida
        if (!imageUrl) {
            return; // No hay URL, no hacer nada
        }
        
        // Extraer la ruta del archivo de la URL
        const filePath = extraerRutaDeStorageUrl(imageUrl);
        if (!filePath) {
            return; // No es una URL válida de Firebase Storage
        }
        
        // Crear referencia y eliminar
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
    } catch (error) {
        // Si el error es que el objeto no existe, solo registrar una advertencia
        if (error.code === 'storage/object-not-found' || error.message?.includes('object-not-found')) {
        } else {
        }
        // No lanzar error - permitir que la función continúe
    }
}

// Función para obtener ejercicios de un entreno específico
// entrenoId puede ser el ID numérico o el firestoreId. Si es numérico, lo convertimos.
// Esta función ahora lee los datos "vivos" desde la biblioteca y combina con datos del entreno
export async function obtenerEjerciciosDeEntreno(entrenoId) {
    try {
        // Si entrenoId es numérico, necesitamos obtener el firestoreId primero
        let firestoreId = entrenoId;
        if (typeof entrenoId === 'number' || /^\d+$/.test(entrenoId)) {
            const entrenos = await cargarEntrenos();
            const entreno = entrenos?.find(e => e.id === parseInt(entrenoId));
            if (!entreno || !entreno.firestoreId) {
                return [];
            }
            firestoreId = entreno.firestoreId;
        }
        
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        const q = query(ejerciciosCollection, orderBy('id', 'asc'));
        const snapshot = await getDocsCacheFirst(q);
        
        const ejercicios = [];
        
        // Cache de categorías para evitar múltiples consultas
        const categoriasCache = new Map();
        
        // Función auxiliar para obtener el nombre de la categoría
        const obtenerNombreCategoria = async (categoriaId) => {
            if (!categoriaId) return '';
            if (categoriasCache.has(categoriaId)) {
                return categoriasCache.get(categoriaId);
            }
            try {
                const categoriaRef = doc(db, getCollectionPath('categoriasMusculares'), categoriaId);
                const categoriaDoc = await getDocCacheFirst(categoriaRef);
                if (categoriaDoc.exists()) {
                    const nombreCategoria = categoriaDoc.data().nombre || '';
                    categoriasCache.set(categoriaId, nombreCategoria);
                    return nombreCategoria;
                }
            } catch (error) {
            }
            return '';
        };
        
        // Procesar cada ejercicio del entreno
        for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const ejercicioEntreno = {
                id: data.id, // ID del ejercicio en el entreno (mantiene posición)
                registros: data.registros || [],
                bibliotecaId: data.bibliotecaId || null,
                categoriaId: data.categoriaId || null,
                fechaCompletado: data.fechaCompletado || null
            };
            
            // Si tiene bibliotecaId, leer datos desde la biblioteca
            if (ejercicioEntreno.bibliotecaId && ejercicioEntreno.categoriaId) {
                try {
                    const ejercicioBibliotecaRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${ejercicioEntreno.categoriaId}/ejercicios`, ejercicioEntreno.bibliotecaId);
                    const ejercicioBibliotecaDoc = await getDocCacheFirst(ejercicioBibliotecaRef);
                    
                    // Obtener nombre de la categoría
                    const nombreCategoria = await obtenerNombreCategoria(ejercicioEntreno.categoriaId);
                    
                    if (ejercicioBibliotecaDoc.exists()) {
                        const dataBiblioteca = ejercicioBibliotecaDoc.data();
                        // Combinar: nombre e imagenUrl de la biblioteca, pero registros y orden del entreno
                        const fechaCompletado = ejercicioEntreno.fechaCompletado || null;
                        const fechaHoyString = obtenerFechaLocal();
                        // Normalizar fechaCompletado a formato YYYY-MM-DD para comparación
                        let fechaCompletadoNormalizada = null;
                        if (fechaCompletado) {
                            if (typeof fechaCompletado === 'string' && fechaCompletado.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                fechaCompletadoNormalizada = fechaCompletado;
                            } else {
                                // Si viene en otro formato, convertir a YYYY-MM-DD
                                fechaCompletadoNormalizada = obtenerFechaLocal(new Date(fechaCompletado));
                            }
                        }
                        ejercicios.push({
                            id: ejercicioEntreno.id,
                            nombre: dataBiblioteca.nombre,
                            imagenUrl: dataBiblioteca.imagenUrl || null,
                            imagenBase64: dataBiblioteca.imagenUrl || null, // Compatibilidad
                            registros: ejercicioEntreno.registros, // Registros del entreno (pueden estar desactualizados, se sincronizan al escribir)
                            bibliotecaId: ejercicioEntreno.bibliotecaId,
                            categoriaId: ejercicioEntreno.categoriaId,
                            nombreCategoria: nombreCategoria || '', // Nombre de la categoría
                            fechaCompletado: fechaCompletadoNormalizada, // Guardar en formato YYYY-MM-DD
                            isCompletedToday: fechaCompletadoNormalizada === fechaHoyString, // Propiedad virtual
                            isOrphan: false
                        });
                    } else {
                        // Si no existe en la biblioteca, marcar como huérfano
                        const nombreCategoria = await obtenerNombreCategoria(ejercicioEntreno.categoriaId);
                        const fechaCompletado = ejercicioEntreno.fechaCompletado || null;
                        const fechaHoyString = obtenerFechaLocal();
                        // Normalizar fechaCompletado a formato YYYY-MM-DD
                        let fechaCompletadoNormalizada = null;
                        if (fechaCompletado) {
                            if (typeof fechaCompletado === 'string' && fechaCompletado.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                fechaCompletadoNormalizada = fechaCompletado;
                            } else {
                                fechaCompletadoNormalizada = obtenerFechaLocal(new Date(fechaCompletado));
                            }
                        }
                        const nombreOriginal = data.nombre || 'Ejercicio no encontrado';
                        ejercicios.push({
                            id: ejercicioEntreno.id,
                            nombre: nombreOriginal + ' (Eliminado)',
                            imagenUrl: data.imagenUrl || null,
                            imagenBase64: data.imagenUrl || null,
                            registros: ejercicioEntreno.registros,
                            bibliotecaId: ejercicioEntreno.bibliotecaId,
                            categoriaId: ejercicioEntreno.categoriaId,
                            nombreCategoria: nombreCategoria || '', // Nombre de la categoría
                            fechaCompletado: fechaCompletadoNormalizada, // Guardar en formato YYYY-MM-DD
                            isCompletedToday: fechaCompletadoNormalizada === fechaHoyString,
                            isOrphan: true // Marcar como huérfano
                        });
                    }
                } catch (error) {
                    // Si hay error, asumir que el ejercicio fue eliminado (marcar como huérfano)
                    const nombreCategoria = await obtenerNombreCategoria(ejercicioEntreno.categoriaId);
                    const fechaCompletado = ejercicioEntreno.fechaCompletado || null;
                    const fechaHoyString = obtenerFechaLocal();
                    // Normalizar fechaCompletado a formato YYYY-MM-DD
                    let fechaCompletadoNormalizada = null;
                    if (fechaCompletado) {
                        if (typeof fechaCompletado === 'string' && fechaCompletado.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            fechaCompletadoNormalizada = fechaCompletado;
                        } else {
                            fechaCompletadoNormalizada = obtenerFechaLocal(new Date(fechaCompletado));
                        }
                    }
                    const nombreOriginal = data.nombre || 'Error al cargar';
                    ejercicios.push({
                        id: ejercicioEntreno.id,
                        nombre: nombreOriginal + ' (Eliminado)',
                        imagenUrl: data.imagenUrl || null,
                        imagenBase64: data.imagenUrl || null,
                        registros: ejercicioEntreno.registros,
                        bibliotecaId: ejercicioEntreno.bibliotecaId,
                        categoriaId: ejercicioEntreno.categoriaId,
                        nombreCategoria: nombreCategoria || '', // Nombre de la categoría
                        fechaCompletado: fechaCompletadoNormalizada, // Guardar en formato YYYY-MM-DD
                        isCompletedToday: fechaCompletadoNormalizada === fechaHoyString,
                        isOrphan: true // Marcar como huérfano
                    });
                }
            } else {
                // Ejercicio viejo sin bibliotecaId (creado manualmente), devolver tal cual
                const nombreCategoria = ejercicioEntreno.categoriaId ? await obtenerNombreCategoria(ejercicioEntreno.categoriaId) : '';
                const fechaCompletado = data.fechaCompletado || null;
                const fechaHoyString = obtenerFechaLocal();
                // Normalizar fechaCompletado a formato YYYY-MM-DD
                let fechaCompletadoNormalizada = null;
                if (fechaCompletado) {
                    if (typeof fechaCompletado === 'string' && fechaCompletado.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        fechaCompletadoNormalizada = fechaCompletado;
                    } else {
                        fechaCompletadoNormalizada = obtenerFechaLocal(new Date(fechaCompletado));
                    }
                }
                ejercicios.push({
                    id: data.id,
                    nombre: data.nombre,
                    imagenUrl: data.imagenUrl,
                    imagenBase64: data.imagenUrl,
                    nombreCategoria: nombreCategoria || '', // Nombre de la categoría
                    registros: data.registros || [],
                    bibliotecaId: null,
                    categoriaId: null,
                    fechaCompletado: fechaCompletadoNormalizada, // Guardar en formato YYYY-MM-DD
                    isCompletedToday: fechaCompletadoNormalizada === fechaHoyString
                });
            }
        }
        
        return ejercicios;
    } catch (error) {
        return [];
    }
}

// Función auxiliar para obtener el firestoreId de un entreno
async function obtenerFirestoreIdDeEntreno(entrenoId) {
    if (typeof entrenoId === 'string' && !/^\d+$/.test(entrenoId)) {
        // Ya es un firestoreId
        return entrenoId;
    }
    
    // Es un ID numérico, buscar el firestoreId
    const entrenos = await cargarEntrenos();
    const entreno = entrenos?.find(e => e.id === parseInt(entrenoId));
    if (!entreno || !entreno.firestoreId) {
        throw new Error('Entreno no encontrado o sin firestoreId');
    }
    return entreno.firestoreId;
}

// Función para agregar ejercicio a un entreno
export async function agregarEjercicioAEntreno(entrenoId, ejercicio) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Si el ejercicio tiene imagenBase64 (archivo), subirlo a Storage
        let imagenUrl = null;
        
        if (ejercicio.imagenBase64 && ejercicio.imagenBase64 instanceof File) {
            // Es un archivo, subirlo a Storage (usar firestoreId para la ruta)
            imagenUrl = await subirImagenAStorage(firestoreId, ejercicio.id, ejercicio.imagenBase64);
        } else if (ejercicio.imagenBase64 && typeof ejercicio.imagenBase64 === 'string' && ejercicio.imagenBase64.startsWith('http')) {
            // Ya es una URL
            imagenUrl = ejercicio.imagenBase64;
        } else if (ejercicio.imagenUrl) {
            // Usar imagenUrl si existe
            imagenUrl = ejercicio.imagenUrl;
        }
        
        // Inicializar registros: si el ejercicio viene de la biblioteca, buscar su historial
        let registrosIniciales = ejercicio.registros || [];
        
        // Si el ejercicio viene de la biblioteca (tiene IDs), buscamos su historial
        if (ejercicio.bibliotecaId && ejercicio.categoriaId) {
            try {
                const docRef = doc(db, getCollectionPath('categoriasMusculares'), ejercicio.categoriaId, 'ejercicios', ejercicio.bibliotecaId);
                const docSnap = await getDocCacheFirst(docRef);
                if (docSnap.exists() && docSnap.data().registros) {
                    registrosIniciales = docSnap.data().registros;
                }
            } catch (error) {
                // Continuar con los registros que vengan en el objeto ejercicio o array vacío
            }
        }
        
        // Preparar datos del ejercicio para Firestore
        const ejercicioData = {
            id: ejercicio.id,
            nombre: ejercicio.nombre,
            imagenUrl: imagenUrl,
            registros: registrosIniciales,
            // Guardar referencia al ID original de la biblioteca si existe
            bibliotecaId: ejercicio.bibliotecaId || null,
            categoriaId: ejercicio.categoriaId || null
        };
        
        // Agregar a Firestore usando el firestoreId
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        await addDoc(ejerciciosCollection, ejercicioData);
    } catch (error) {
        throw error;
    }
}

// Función auxiliar para obtener fecha local en formato YYYY-MM-DD
export function obtenerFechaLocal(fecha = null) {
    const ahora = fecha || new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Función para toggle del estado completado de un ejercicio
export async function toggleCompletadoEjercicio(entrenoId, ejercicioId, estado, entrenoNombre, totalEjercicios) {
    try {
        // 1. Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // 2. Buscar el documento del ejercicio en Firestore
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        const snapshot = await getDocsCacheFirst(ejerciciosCollection);
        
        let docId = null;
        snapshot.forEach(docSnapshot => {
            if (docSnapshot.data().id === ejercicioId) {
                docId = docSnapshot.id;
            }
        });
        
        if (!docId) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // 3. Referencia al ejercicio dentro del entreno
        const ejercicioRef = doc(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios/${docId}`);
        
        // 4. Determinar la fecha (String local)
        // Si estado es 'completado' (marcado) -> fecha de hoy. Si no -> null.
        const fechaHoy = new Date();
        const fechaString = obtenerFechaLocal(fechaHoy);
        const nuevaFecha = estado === 'completado' ? fechaString : null;
        
        // 5. ACTUALIZAR EL EJERCICIO (Para el Checklist)
        await updateDoc(ejercicioRef, {
            fechaCompletado: nuevaFecha
        });
        
        // 6. ACTUALIZAR EL HISTORIAL DEL DÍA (Para el Calendario)
        // Solo si tenemos el nombre y el total (si no, es un toggle rápido que no afecta historial global)
        if (entrenoNombre && totalEjercicios) {
            const historialRef = doc(db, getCollectionPath('historialDias'), fechaString);
            const historialSnap = await getDocCacheFirst(historialRef);
            
            let cantidadActual = 0;
            
            if (historialSnap.exists()) {
                cantidadActual = historialSnap.data().cantidadCompletada || 0;
            }
            
            // Calcular nueva cantidad
            let nuevaCantidad = estado === 'completado' ? cantidadActual + 1 : cantidadActual - 1;
            if (nuevaCantidad < 0) nuevaCantidad = 0;
            
            // Guardar o Borrar el día
            if (nuevaCantidad > 0) {
                await setDoc(historialRef, {
                    fecha: fechaString,
                    timestamp: new Date(fechaString + 'T12:00:00').getTime(),
                    cantidadCompletada: nuevaCantidad,
                    totalEjercicios: totalEjercicios,
                    entrenoNombre: entrenoNombre
                }, { merge: true });
            } else {
                // Si bajó a 0, borramos el día para que salga Rojo en el calendario
                if (historialSnap.exists()) {
                    await deleteDoc(historialRef);
                }
            }
        }
        
        return nuevaFecha !== null;
    } catch (error) {
        throw error;
    }
}

// Función para eliminar ejercicio de un entreno
export async function eliminarEjercicioDeEntreno(entrenoId, ejercicioId) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Buscar el documento en Firestore
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        const snapshot = await getDocsCacheFirst(ejerciciosCollection);
        
        let docId = null;
        snapshot.forEach(docSnapshot => {
            if (docSnapshot.data().id === ejercicioId) {
                docId = docSnapshot.id;
            }
        });
        
        if (docId) {
            await deleteDoc(doc(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios/${docId}`));
        } else {
            throw new Error('Ejercicio no encontrado en Firestore');
        }
        
        // NOTA: NO eliminamos la imagen de Storage aquí porque:
        // 1. La imagen pertenece a la BIBLIOTECA, no al entreno
        // 2. El ejercicio puede estar en otros entrenos
        // 3. La imagen solo debe eliminarse cuando se elimina PERMANENTEMENTE de la biblioteca
    } catch (error) {
        throw error;
    }
}

// Función para actualizar ejercicio en un entreno
export async function actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Buscar el documento en Firestore
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        const snapshot = await getDocsCacheFirst(ejerciciosCollection);
        
        let docId = null;
        let ejercicioExistente = null;
        snapshot.forEach(docSnapshot => {
            if (docSnapshot.data().id === ejercicioActualizado.id) {
                docId = docSnapshot.id;
                ejercicioExistente = docSnapshot.data();
            }
        });
        
        if (!docId) {
            throw new Error('Ejercicio no encontrado');
        }
        
        let imagenUrl = ejercicioExistente.imagenUrl;
        
        // Si hay una nueva imagen (archivo), subirla y eliminar la antigua
        if (ejercicioActualizado.imagenBase64 && ejercicioActualizado.imagenBase64 instanceof File) {
            // Eliminar imagen antigua
            if (ejercicioExistente.imagenUrl) {
                await eliminarImagenDeStorage(ejercicioExistente.imagenUrl);
            }
            
            // Subir nueva imagen (usar firestoreId para la ruta)
            imagenUrl = await subirImagenAStorage(firestoreId, ejercicioActualizado.id, ejercicioActualizado.imagenBase64);
        } else if (ejercicioActualizado.imagenBase64 && typeof ejercicioActualizado.imagenBase64 === 'string') {
            // Si es una URL, usarla directamente
            if (ejercicioActualizado.imagenBase64.startsWith('http')) {
                imagenUrl = ejercicioActualizado.imagenBase64;
            } else {
                // Si es Base64, mantener la URL existente (no cambiar imagen)
                imagenUrl = ejercicioExistente.imagenUrl;
            }
        } else if (ejercicioActualizado.imagenUrl) {
            imagenUrl = ejercicioActualizado.imagenUrl;
        }
        
        // Actualizar en Firestore usando el firestoreId
        // IMPORTANTE: Los registros deben tener fecha como string YYYY-MM-DD, no Date objects
        const registrosParaGuardar = (ejercicioActualizado.registros || ejercicioExistente.registros || []).map(reg => {
            // Asegurar que cada registro tenga fecha como string
            if (reg && reg.fecha && typeof reg.fecha !== 'string') {
                const regCopy = { ...reg };
                const fechaObj = new Date(reg.fecha);
                const year = fechaObj.getFullYear();
                const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
                const day = String(fechaObj.getDate()).padStart(2, '0');
                regCopy.fecha = `${year}-${month}-${day}`;
                return regCopy;
            }
            return reg;
        });
        
        const ejercicioRef = doc(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios/${docId}`);
        await updateDoc(ejercicioRef, {
            nombre: ejercicioActualizado.nombre,
            imagenUrl: imagenUrl,
            registros: registrosParaGuardar
        });
    } catch (error) {
        throw error;
    }
}

// Función para sustituir un ejercicio en un entreno
export async function sustituirEjercicioEnEntreno(entrenoId, ejercicioIdOriginal, nuevoEjercicioBibliotecaId, nuevoEjercicioCategoriaId) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Obtener el ejercicio original para mantener su posición
        const ejercicioOriginal = await obtenerEjercicio(entrenoId, ejercicioIdOriginal);
        if (!ejercicioOriginal) {
            throw new Error('Ejercicio original no encontrado');
        }
        
        // Obtener los datos del nuevo ejercicio desde la biblioteca
        const ejerciciosBiblioteca = await obtenerEjerciciosDeCategoria(nuevoEjercicioCategoriaId);
        const nuevoEjercicio = ejerciciosBiblioteca.find(ej => ej.id === nuevoEjercicioBibliotecaId);
        
        if (!nuevoEjercicio) {
            throw new Error('Nuevo ejercicio no encontrado en la biblioteca');
        }
        
        // Obtener los registros del ejercicio de la biblioteca
        let registrosDelEjercicio = [];
        try {
            const ejercicioBibliotecaRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${nuevoEjercicioCategoriaId}/ejercicios`, nuevoEjercicioBibliotecaId);
            const ejercicioBibliotecaDoc = await getDoc(ejercicioBibliotecaRef);
            if (ejercicioBibliotecaDoc.exists()) {
                const data = ejercicioBibliotecaDoc.data();
                registrosDelEjercicio = data.registros || [];
            }
        } catch (error) {
            // Continuar con array vacío si falla
        }
        
        // Buscar el documento en Firestore del ejercicio original
        const ejerciciosCollection = collection(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios`);
        const snapshot = await getDocsCacheFirst(ejerciciosCollection);
        
        let docId = null;
        snapshot.forEach(docSnapshot => {
            if (docSnapshot.data().id === ejercicioIdOriginal) {
                docId = docSnapshot.id;
            }
        });
        
        if (!docId) {
            throw new Error('Ejercicio no encontrado en Firestore');
        }
        
        // Actualizar el ejercicio manteniendo su ID y posición, pero cambiando los datos
        // IMPORTANTE: Recuperar los registros del ejercicio de la biblioteca
        const ejercicioRef = doc(db, `${getCollectionPath('entrenos')}/${firestoreId}/ejercicios/${docId}`);
        await updateDoc(ejercicioRef, {
            nombre: nuevoEjercicio.nombre,
            imagenUrl: nuevoEjercicio.imagenUrl,
            bibliotecaId: nuevoEjercicioBibliotecaId,
            categoriaId: nuevoEjercicioCategoriaId,
            registros: registrosDelEjercicio // Recuperar registros de la biblioteca
            // NO actualizar: id (se mantiene para preservar posición)
        });
    } catch (error) {
        throw error;
    }
}

// Función para obtener un ejercicio específico
export async function obtenerEjercicio(entrenoId, ejercicioId) {
    try {
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoId);
        const ejercicio = ejercicios.find(e => e.id === ejercicioId);
        return ejercicio || null;
    } catch (error) {
        return null;
    }
}

// Función para obtener el último registro de un ejercicio
// Devuelve el registro más reciente (el primero del array, ya que usamos unshift)
export async function obtenerUltimoRegistro(entrenoId, ejercicioId) {
    try {
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            return null;
        }
        
        const registros = ejercicio.registros || [];
        if (registros.length === 0) {
            return null;
        }
        
        // El primer registro es el más reciente (se agrega con unshift)
        return registros[0];
    } catch (error) {
        return null;
    }
}

// Función para agregar registro a un ejercicio
export async function agregarRegistroAEjercicio(entrenoId, ejercicioId, nuevoRegistro) {
    try {
        // IMPORTANTE: nuevoRegistro.fecha debe venir como string YYYY-MM-DD directamente del input
        // NO convertir a Date antes de guardar
        
        // Obtener el ejercicio actual
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // Agregar ID único al registro
        nuevoRegistro.id = Date.now();
        
        // Asegurar que la fecha sea string (no Date object)
        if (nuevoRegistro.fecha && typeof nuevoRegistro.fecha !== 'string') {
            // Si por alguna razón viene como Date, convertir a string YYYY-MM-DD
            const fechaObj = new Date(nuevoRegistro.fecha);
            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            nuevoRegistro.fecha = `${year}-${month}-${day}`;
        }
        
        // Inicializar array de registros si no existe
        const registros = ejercicio.registros || [];
        registros.unshift(nuevoRegistro); // Agregar al inicio (más reciente primero)
        
        // Actualizar el ejercicio con el nuevo registro
        const ejercicioActualizado = {
            id: ejercicio.id,
            nombre: ejercicio.nombre,
            imagenUrl: ejercicio.imagenUrl,
            imagenBase64: ejercicio.imagenUrl, // Compatibilidad
            registros: registros
        };
        
        await actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado);
        
        // Sincronizar con la biblioteca si el ejercicio tiene bibliotecaId
        if (ejercicio.bibliotecaId && ejercicio.categoriaId) {
            try {
                const ejercicioBibliotecaRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${ejercicio.categoriaId}/ejercicios`, ejercicio.bibliotecaId);
                await updateDoc(ejercicioBibliotecaRef, {
                    registros: registros
                });
            } catch (error) {
                // No lanzar error - permitir que continúe aunque falle la sincronización
            }
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para eliminar registro de un ejercicio
export async function eliminarRegistroDeEjercicio(entrenoId, ejercicioId, registroId) {
    try {
        // Obtener el ejercicio actual
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // Filtrar el registro
        const registros = (ejercicio.registros || []).filter(r => r.id !== registroId);
        
        // Actualizar el ejercicio
        const ejercicioActualizado = {
            id: ejercicio.id,
            nombre: ejercicio.nombre,
            imagenUrl: ejercicio.imagenUrl,
            imagenBase64: ejercicio.imagenUrl, // Compatibilidad
            registros: registros
        };
        
        await actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado);
        
        // Sincronizar con la biblioteca si el ejercicio tiene bibliotecaId
        if (ejercicio.bibliotecaId && ejercicio.categoriaId) {
            try {
                const ejercicioBibliotecaRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${ejercicio.categoriaId}/ejercicios`, ejercicio.bibliotecaId);
                await updateDoc(ejercicioBibliotecaRef, {
                    registros: registros
                });
            } catch (error) {
                // No lanzar error - permitir que continúe aunque falle la sincronización
            }
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para actualizar registro en un ejercicio
export async function actualizarRegistroEnEjercicio(entrenoId, ejercicioId, registroId, datosActualizados) {
    try {
        // IMPORTANTE: datosActualizados.fecha debe venir como string YYYY-MM-DD directamente del input
        // NO convertir a Date antes de guardar
        
        // Obtener el ejercicio actual
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // Mantener el ID original
        datosActualizados.id = registroId;
        
        // Asegurar que la fecha sea string (no Date object)
        if (datosActualizados.fecha && typeof datosActualizados.fecha !== 'string') {
            // Si por alguna razón viene como Date, convertir a string YYYY-MM-DD
            const fechaObj = new Date(datosActualizados.fecha);
            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            datosActualizados.fecha = `${year}-${month}-${day}`;
        }
        
        // Actualizar el registro en el array
        const registros = ejercicio.registros || [];
        const index = registros.findIndex(r => r.id === registroId);
        if (index === -1) {
            throw new Error('Registro no encontrado');
        }
        
        registros[index] = datosActualizados;
        
        // Actualizar el ejercicio
        const ejercicioActualizado = {
            id: ejercicio.id,
            nombre: ejercicio.nombre,
            imagenUrl: ejercicio.imagenUrl,
            imagenBase64: ejercicio.imagenUrl, // Compatibilidad
            registros: registros
        };
        
        await actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado);
        
        // Sincronizar con la biblioteca si el ejercicio tiene bibliotecaId
        if (ejercicio.bibliotecaId && ejercicio.categoriaId) {
            try {
                const ejercicioBibliotecaRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${ejercicio.categoriaId}/ejercicios`, ejercicio.bibliotecaId);
                await updateDoc(ejercicioBibliotecaRef, {
                    registros: registros
                });
            } catch (error) {
                // No lanzar error - permitir que continúe aunque falle la sincronización
            }
        }
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función de compatibilidad: convertirImagenABase64 ahora devuelve el archivo directamente
// para que pueda ser subido a Storage
export async function convertirImagenABase64(file) {
    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
    }
    
    // Devolver el archivo directamente (ya no convertimos a Base64)
    return file;
}

// ========== CATEGORÍAS MUSCULARES ==========

// Función para agregar una categoría muscular
export async function agregarCategoria(nombreCategoria) {
    try {
        const categoriasCollection = collection(db, getCollectionPath('categoriasMusculares'));
        
        // Preparar los datos para guardar
        const datosParaGuardar = {
            nombre: nombreCategoria.trim(),
            fechaCreacion: new Date().toISOString()
        };
        
        // Agregar el documento a Firestore
        const docRef = await addDoc(categoriasCollection, datosParaGuardar);
        
        return docRef.id;
    } catch (error) {
        throw error;
    }
}

// Función para obtener todas las categorías musculares
export async function obtenerCategorias() {
    try {
        const categoriasCollection = collection(db, getCollectionPath('categoriasMusculares'));
        const q = query(categoriasCollection, orderBy('fechaCreacion', 'asc'));
        const snapshot = await getDocsCacheFirst(q);
        
        if (snapshot.empty) {
            return [];
        }
        
        const categorias = [];
        snapshot.forEach(docSnapshot => {
            categorias.push({
                id: docSnapshot.id, // ID del documento de Firestore
                nombre: docSnapshot.data().nombre,
                fechaCreacion: docSnapshot.data().fechaCreacion
            });
        });
        
        return categorias;
    } catch (error) {
        throw error;
    }
}

// Función para editar una categoría muscular
export async function editarCategoria(id, nuevoNombre) {
    try {
        const categoriaRef = doc(db, getCollectionPath('categoriasMusculares'), id);
        
        // Actualizar el documento
        await updateDoc(categoriaRef, {
            nombre: nuevoNombre.trim()
        });
    } catch (error) {
        throw error;
    }
}

// Función para eliminar una categoría muscular
export async function eliminarCategoria(id) {
    try {
        // Primero, eliminar todos los ejercicios de la subcolección
        const ejerciciosCollection = collection(db, `${getCollectionPath('categoriasMusculares')}/${id}/ejercicios`);
        const ejerciciosSnapshot = await getDocs(ejerciciosCollection);
        
        // Eliminar cada ejercicio y su imagen
        const promesasEliminacion = [];
        ejerciciosSnapshot.forEach(async (ejercicioDoc) => {
            const ejercicioData = ejercicioDoc.data();
            
            // Eliminar imagen de Storage si existe
            if (ejercicioData.imagenUrl) {
                promesasEliminacion.push(eliminarImagenDeStorage(ejercicioData.imagenUrl));
            }
            
            // Eliminar documento del ejercicio
            promesasEliminacion.push(deleteDoc(doc(db, `${getCollectionPath('categoriasMusculares')}/${id}/ejercicios/${ejercicioDoc.id}`)));
        });
        
        // Esperar a que se eliminen todos los ejercicios
        await Promise.all(promesasEliminacion);
        
        // Finalmente, eliminar la categoría
        const categoriaRef = doc(db, getCollectionPath('categoriasMusculares'), id);
        await deleteDoc(categoriaRef);
    } catch (error) {
        throw error;
    }
}

// Función para subir imagen de ejercicio de categoría a Firebase Storage
async function subirImagenEjercicioCategoriaAStorage(categoriaId, ejercicioId, archivo) {
    try {
        // Validar tamaño del archivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (archivo.size > maxSize) {
            throw new Error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
        }
        
        // Crear referencia en Storage
        const fileName = `categoria_${categoriaId}_${ejercicioId}_${Date.now()}_${archivo.name}`;
        const storageRef = ref(storage, `images/categorias/${categoriaId}/${fileName}`);
        
        // Subir el archivo
        await uploadBytes(storageRef, archivo);
        
        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    } catch (error) {
        throw error;
    }
}

// Función para agregar un ejercicio a una categoría
export async function agregarEjercicioACategoria(categoriaId, ejercicioData) {
    try {
        const categoriaRef = doc(db, getCollectionPath('categoriasMusculares'), categoriaId);
        const ejerciciosCollection = collection(categoriaRef, 'ejercicios');
        
        // Si hay un archivo de imagen, subirlo primero
        let imagenUrl = ejercicioData.imagenUrl || null;
        if (ejercicioData.archivoImagen) {
            // Generar un ID temporal para el nombre del archivo
            const tempId = Date.now().toString();
            imagenUrl = await subirImagenEjercicioCategoriaAStorage(categoriaId, tempId, ejercicioData.archivoImagen);
        }
        
        // Preparar los datos para guardar
        const datosParaGuardar = {
            nombre: ejercicioData.nombre.trim(),
            imagenUrl: imagenUrl,
            fechaCreacion: new Date().toISOString()
        };
        
        // Agregar el documento a la subcolección
        const docRef = await addDoc(ejerciciosCollection, datosParaGuardar);
        
        return docRef.id;
    } catch (error) {
        throw error;
    }
}

// Función para obtener todos los ejercicios de una categoría
export async function obtenerEjerciciosDeCategoria(categoriaId) {
    try {
        const categoriaRef = doc(db, getCollectionPath('categoriasMusculares'), categoriaId);
        const ejerciciosCollection = collection(categoriaRef, 'ejercicios');
        const q = query(ejerciciosCollection, orderBy('fechaCreacion', 'asc'));
        const snapshot = await getDocsCacheFirst(q);
        
        if (snapshot.empty) {
            return [];
        }
        
        const ejercicios = [];
        snapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            ejercicios.push({
                id: docSnapshot.id, // ID del documento de Firestore
                nombre: data.nombre,
                imagenUrl: data.imagenUrl || null,
                fechaCreacion: data.fechaCreacion,
                registros: data.registros || [] // Incluir registros del ejercicio
            });
        });
        
        return ejercicios;
    } catch (error) {
        throw error;
    }
}

// Función para obtener todos los ejercicios de todas las categorías (para el modal de selección)
export async function obtenerTodosLosEjerciciosDeBiblioteca() {
    try {
        // Paso 1: Obtener todas las categorías
        const categorias = await obtenerCategorias();
        
        if (!categorias || categorias.length === 0) {
            return [];
        }
        
        // Paso 2: Usar Promise.all para buscar ejercicios en paralelo
        const promesas = categorias.map(async (cat) => {
            try {
                const ejercicios = await obtenerEjerciciosDeCategoria(cat.id);
                
                // Solo devolver si hay ejercicios
                if (ejercicios && ejercicios.length > 0) {
                    return {
                        categoria: {
                            id: cat.id,
                            nombre: cat.nombre
                        },
                        ejercicios: ejercicios.map(ej => ({
                            ...ej,
                            categoriaId: cat.id,
                            bibliotecaId: ej.id // ID original en la biblioteca
                        }))
                    };
                }
                // Si no hay ejercicios, devolver null (se filtrará después)
                return null;
            } catch (error) {
                // Si una categoría falla, solo loguear el warning y continuar
                return null; // Devuelve null, no rompe todo
            }
        });
        
        // Esperar todas las promesas (incluso las que fallaron)
        const resultados = await Promise.all(promesas);
        
        // Filtrar los nulls y devolver solo las categorías con ejercicios
        return resultados.filter(item => item !== null);
    } catch (error) {
        // Error fatal: siempre devolver array vacío, nunca lanzar error
        return [];
    }
}

// Función para editar un ejercicio de una categoría
export async function editarEjercicioDeCategoria(categoriaId, ejercicioId, ejercicioData) {
    try {
        const ejercicioRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${categoriaId}/ejercicios/${ejercicioId}`);
        
        // Obtener el ejercicio existente para mantener la imagen si no se cambia
        const ejercicioSnapshot = await getDocs(collection(db, `${getCollectionPath('categoriasMusculares')}/${categoriaId}/ejercicios`));
        let ejercicioExistente = null;
        ejercicioSnapshot.forEach(docSnapshot => {
            if (docSnapshot.id === ejercicioId) {
                ejercicioExistente = docSnapshot.data();
            }
        });
        
        if (!ejercicioExistente) {
            throw new Error('Ejercicio no encontrado');
        }
        
        let imagenUrl = ejercicioExistente.imagenUrl;
        
        // Si hay una nueva imagen (archivo), subirla y eliminar la antigua
        if (ejercicioData.archivoImagen && ejercicioData.archivoImagen instanceof File) {
            // Eliminar imagen antigua
            if (ejercicioExistente.imagenUrl) {
                await eliminarImagenDeStorage(ejercicioExistente.imagenUrl);
            }
            
            // Subir nueva imagen
            imagenUrl = await subirImagenEjercicioCategoriaAStorage(categoriaId, ejercicioId, ejercicioData.archivoImagen);
        } else if (ejercicioData.imagenUrl) {
            imagenUrl = ejercicioData.imagenUrl;
        }
        
        // Actualizar en Firestore
        await updateDoc(ejercicioRef, {
            nombre: ejercicioData.nombre.trim(),
            imagenUrl: imagenUrl
        });
    } catch (error) {
        throw error;
    }
}

// Función para eliminar un ejercicio de una categoría
export async function eliminarEjercicioDeCategoria(categoriaId, ejercicioId) {
    try {
        // Obtener el ejercicio para eliminar su imagen
        const ejercicioRef = doc(db, `${getCollectionPath('categoriasMusculares')}/${categoriaId}/ejercicios/${ejercicioId}`);
        const ejercicioSnapshot = await getDocs(collection(db, `${getCollectionPath('categoriasMusculares')}/${categoriaId}/ejercicios`));
        
        let imagenUrl = null;
        ejercicioSnapshot.forEach(docSnapshot => {
            if (docSnapshot.id === ejercicioId) {
                const data = docSnapshot.data();
                imagenUrl = data.imagenUrl;
            }
        });
        
        // Eliminar la imagen de Storage si existe
        if (imagenUrl) {
            try {
                await eliminarImagenDeStorage(imagenUrl);
            } catch (error) {
                // Si la imagen no se encuentra, no es un error fatal
                if (error.code !== 'storage/object-not-found') {
                } else {
                }
            }
        }
        
        // Eliminar el documento de Firestore
        await deleteDoc(ejercicioRef);
    } catch (error) {
        throw error;
    }
}

// ========== PERFIL DE USUARIO ==========

// Función para guardar/actualizar el perfil del usuario
export async function guardarPerfil(datos) {
    try {
        const perfilPath = getCollectionPath('mi_perfil');
        const perfilRef = doc(db, perfilPath);
        await setDoc(perfilRef, {
            nombre: datos.nombre || '',
            peso: datos.peso || null,
            altura: datos.altura || null,
            edad: datos.edad || null,
            fechaActualizacion: new Date().toISOString()
        }, { merge: true });
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para obtener el perfil del usuario
export async function obtenerPerfil() {
    try {
        const perfilPath = getCollectionPath('mi_perfil');
        const perfilRef = doc(db, perfilPath);
        const perfilSnap = await getDocCacheFirst(perfilRef);
        
        if (perfilSnap.exists()) {
            return perfilSnap.data();
        } else {
            // Si no existe, devolver un objeto vacío
            return {
                nombre: '',
                peso: null,
                altura: null,
                edad: null
            };
        }
    } catch (error) {
        throw error;
    }
}

// ========== HISTORIAL CORPORAL ==========

// Función auxiliar para convertir fecha YYYY-MM-DD a timestamp sin problemas de timezone
function fechaStringATimestamp(fechaString) {
    if (!fechaString) return Date.now();
    // Si la fecha viene como YYYY-MM-DD, crear Date con mediodía local para evitar problemas de timezone
    const partes = fechaString.split('-');
    if (partes.length === 3) {
        const año = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mes es 0-indexed
        const dia = parseInt(partes[2], 10);
        // Usar mediodía local para evitar cambios de día por zona horaria
        return new Date(año, mes, dia, 12, 0, 0).getTime();
    }
    return new Date(fechaString).getTime();
}

// Función para guardar una medición corporal
export async function guardarMedicion(datos) {
    try {
        // Guardar la fecha como string YYYY-MM-DD directamente, sin conversión a ISO
        // Si no viene fecha, usar fecha local
        let fechaString = datos.fecha;
        if (!fechaString) {
            const ahora = new Date();
            const year = ahora.getFullYear();
            const month = String(ahora.getMonth() + 1).padStart(2, '0');
            const day = String(ahora.getDate()).padStart(2, '0');
            fechaString = `${year}-${month}-${day}`;
        }
        
        const medicionData = {
            fecha: fechaString,
            peso: datos.peso || null,
            grasa: datos.grasa || null,
            musculo: datos.musculo || null,
            agua: datos.agua || null,
            visceral: datos.visceral || null,
            timestamp: fechaStringATimestamp(fechaString)
        };
        
        const historialCollection = collection(db, getCollectionPath('historialCorporal'));
        await addDoc(historialCollection, medicionData);
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para obtener el historial corporal
export async function obtenerHistorialCorporal() {
    try {
        const historialCollection = collection(db, getCollectionPath('historialCorporal'));
        const q = query(historialCollection, orderBy('timestamp', 'asc'));
        const snapshot = await getDocsCacheFirst(q);
        
        const historial = [];
        snapshot.forEach(doc => {
            historial.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return historial;
    } catch (error) {
        throw error;
    }
}

// Función para actualizar una medición existente
export async function actualizarMedicion(id, datos) {
    try {
        const medicionRef = doc(db, getCollectionPath('historialCorporal'), id);
        // Guardar la fecha como string YYYY-MM-DD directamente, sin conversión a ISO
        // Si no viene fecha, usar fecha local
        let fechaString = datos.fecha;
        if (!fechaString) {
            const ahora = new Date();
            const year = ahora.getFullYear();
            const month = String(ahora.getMonth() + 1).padStart(2, '0');
            const day = String(ahora.getDate()).padStart(2, '0');
            fechaString = `${year}-${month}-${day}`;
        }
        
        const medicionData = {
            fecha: fechaString,
            peso: datos.peso || null,
            grasa: datos.grasa || null,
            musculo: datos.musculo || null,
            agua: datos.agua || null,
            visceral: datos.visceral || null,
            timestamp: fechaStringATimestamp(fechaString)
        };
        
        await updateDoc(medicionRef, medicionData);
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para eliminar una medición específica
export async function eliminarMedicion(id) {
    try {
        const medicionRef = doc(db, getCollectionPath('historialCorporal'), id);
        await deleteDoc(medicionRef);
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Función para borrar todo el historial corporal (solo para desarrollo)
export async function borrarTodoHistorialCorporal() {
    try {
        const historialCollection = collection(db, getCollectionPath('historialCorporal'));
        const snapshot = await getDocsCacheFirst(historialCollection);
        
        const deletePromises = [];
        snapshot.forEach(doc => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        return true;
    } catch (error) {
        throw error;
    }
}

// ========== BIBLIOTECA DE EJERCICIOS ==========

// Función para subir imagen de biblioteca a Firebase Storage
async function subirImagenBibliotecaAStorage(ejercicioId, archivo) {
    try {
        // Validar tamaño del archivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (archivo.size > maxSize) {
            throw new Error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
        }
        
        // Crear referencia en Storage
        const fileName = `biblioteca_${ejercicioId}_${Date.now()}_${archivo.name}`;
        const storageRef = ref(storage, `images/biblioteca/${fileName}`);
        
        // Subir el archivo
        await uploadBytes(storageRef, archivo);
        
        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        
        return downloadURL;
    } catch (error) {
        throw error;
    }
}

// Función para agregar un ejercicio a la biblioteca
export async function agregarEjercicioABiblioteca(ejercicioData) {
    try {
        const bibliotecaCollection = collection(db, getCollectionPath('bibliotecaEjercicios'));
        
        // Si hay un archivo de imagen, subirlo primero
        let imagenUrl = ejercicioData.imagenUrl || null;
        if (ejercicioData.archivoImagen) {
            // Generar un ID temporal para el nombre del archivo
            const tempId = Date.now().toString();
            imagenUrl = await subirImagenBibliotecaAStorage(tempId, ejercicioData.archivoImagen);
        }
        
        // Preparar los datos para guardar
        const datosParaGuardar = {
            nombre: ejercicioData.nombre,
            etiqueta: ejercicioData.etiqueta || '',
            imagenUrl: imagenUrl,
            fechaCreacion: new Date().toISOString()
        };
        
        // Agregar el documento a Firestore
        const docRef = await addDoc(bibliotecaCollection, datosParaGuardar);
        
        return docRef.id;
    } catch (error) {
        throw error;
    }
}

// Función para obtener todos los ejercicios de la biblioteca
export async function obtenerEjerciciosBiblioteca() {
    try {
        const bibliotecaCollection = collection(db, getCollectionPath('bibliotecaEjercicios'));
        const q = query(bibliotecaCollection, orderBy('fechaCreacion', 'desc'));
        const snapshot = await getDocsCacheFirst(q);
        
        if (snapshot.empty) {
            return [];
        }
        
        const ejercicios = [];
        snapshot.forEach(docSnapshot => {
            ejercicios.push({
                id: docSnapshot.id, // ID del documento de Firestore
                nombre: docSnapshot.data().nombre,
                etiqueta: docSnapshot.data().etiqueta || '',
                imagenUrl: docSnapshot.data().imagenUrl || null,
                fechaCreacion: docSnapshot.data().fechaCreacion
            });
        });
        
        return ejercicios;
    } catch (error) {
        throw error;
    }
}

// Función para editar un ejercicio de la biblioteca
export async function editarEjercicioBiblioteca(id, data) {
    try {
        const ejercicioRef = doc(db, getCollectionPath('bibliotecaEjercicios'), id);
        
        // Obtener el ejercicio actual para verificar si hay imagen existente
        const ejercicioDoc = await getDocCacheFirst(ejercicioRef);
        if (!ejercicioDoc.exists()) {
            throw new Error('Ejercicio no encontrado');
        }
        
        const ejercicioActual = ejercicioDoc.data();
        let imagenUrl = ejercicioActual.imagenUrl || null;
        
        // Si hay un nuevo archivo de imagen, subirlo
        if (data.archivoImagen) {
            // Si había una imagen anterior, eliminarla
            if (imagenUrl) {
                await eliminarImagenDeStorage(imagenUrl);
            }
            // Subir la nueva imagen
            imagenUrl = await subirImagenBibliotecaAStorage(id, data.archivoImagen);
        }
        
        // Preparar los datos para actualizar
        const datosParaActualizar = {
            nombre: data.nombre,
            etiqueta: data.etiqueta || '',
            imagenUrl: imagenUrl
        };
        
        // Actualizar el documento
        await updateDoc(ejercicioRef, datosParaActualizar);
    } catch (error) {
        throw error;
    }
}

// Función para eliminar un ejercicio de la biblioteca
export async function eliminarEjercicioBiblioteca(id) {
    try {
        const ejercicioRef = doc(db, getCollectionPath('bibliotecaEjercicios'), id);
        
        // Paso 1: Obtener el ejercicio para eliminar su imagen si existe
        const ejercicioDoc = await getDocCacheFirst(ejercicioRef);
        let imagenUrl = null;
        if (ejercicioDoc.exists()) {
            const ejercicio = ejercicioDoc.data();
            imagenUrl = ejercicio.imagenUrl || null;
            
            // Eliminar la imagen de Storage si existe
            if (imagenUrl) {
                await eliminarImagenDeStorage(imagenUrl);
            }
        }
        
        // Paso 2: Buscar y eliminar referencias en todos los entrenos
        // 1. Obtener todos los entrenos
        const entrenosSnap = await getDocsCacheFirst(collection(db, getCollectionPath('entrenos')));
        
        // 2. Recorrer cada entreno
        for (const entrenoDoc of entrenosSnap.docs) {
            // 3. Buscar en la subcolección 'ejercicios' de este entreno
            const ejerciciosRef = collection(db, getCollectionPath('entrenos'), entrenoDoc.id, 'ejercicios');
            const q = query(ejerciciosRef, where('bibliotecaId', '==', id));
            const querySnapshot = await getDocsCacheFirst(q);
            
            // 4. Borrar cada coincidencia encontrada
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        }
        
        // Paso 3: Finalmente, eliminar el documento de la biblioteca
        await deleteDoc(ejercicioRef);
    } catch (error) {
        throw error;
    }
}

// ========== HISTORIAL DE DÍAS ENTRENADOS ==========

// Función para obtener todos los días entrenados con datos enriquecidos
export async function obtenerDiasEntrenados() {
    try {
        const historialCollection = collection(db, getCollectionPath('historialDias'));
        // NO usar orderBy('timestamp') porque los documentos antiguos pueden no tener ese campo
        // Simplemente obtener todos los documentos y ordenar por el ID (que es la fecha)
        const snapshot = await getDocsCacheFirst(historialCollection);
        
        const dias = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            dias.push({
                fecha: doc.id, // El ID del documento es la fecha (YYYY-MM-DD)
                cantidadCompletada: data.cantidadCompletada || 0,
                totalEjercicios: data.totalEjercicios || 0,
                entrenoNombre: data.entrenoNombre || 'Entreno',
                porcentaje: data.porcentaje || 0,
                timestamp: data.timestamp || null
            });
        });
        
        // Ordenar fechas de más reciente a más antigua (el ID es YYYY-MM-DD, así que se ordena lexicográficamente)
        dias.sort((a, b) => b.fecha.localeCompare(a.fecha));
        
        return dias;
    } catch (error) {
        throw error;
    }
}
