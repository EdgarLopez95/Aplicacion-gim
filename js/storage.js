// storage.js - Lógica de Firebase (Firestore y Storage)

import { db, storage } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// Datos de ejemplo para los entrenos
export const entrenosEjemplo = [
    {
        id: 1,
        nombre: 'Piernas',
        imagen: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
        descripcion: 'Entreno de piernas completo'
    },
    {
        id: 2,
        nombre: 'Push',
        imagen: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
        descripcion: 'Pecho, hombro y tríceps'
    },
    {
        id: 3,
        nombre: 'Pull',
        imagen: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
        descripcion: 'Espalda y bíceps'
    },
    {
        id: 4,
        nombre: 'Glúteo',
        imagen: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
        descripcion: 'Entreno enfocado en glúteos'
    }
];

// Función para guardar entrenos en Firestore
export async function guardarEntrenos(entrenos) {
    try {
        const entrenosCollection = collection(db, 'entrenos');
        
        // Eliminar todos los entrenos existentes primero
        const snapshot = await getDocs(entrenosCollection);
        const deletePromises = snapshot.docs.map(docSnapshot => 
            deleteDoc(doc(db, 'entrenos', docSnapshot.id))
        );
        await Promise.all(deletePromises);
        
        // Agregar los nuevos entrenos
        const addPromises = entrenos.map(entreno => 
            addDoc(entrenosCollection, entreno)
        );
        await Promise.all(addPromises);
        
        console.log('Entrenos guardados en Firestore');
    } catch (error) {
        console.error('Error al guardar entrenos en Firestore:', error);
        throw error;
    }
}

// Función para cargar entrenos desde Firestore
export async function cargarEntrenos() {
    try {
        const entrenosCollection = collection(db, 'entrenos');
        const snapshot = await getDocs(entrenosCollection);
        
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
        console.error('Error al cargar entrenos desde Firestore:', error);
        throw error;
    }
}

// Función para inicializar datos en Firestore
export async function inicializarDatos() {
    try {
        const entrenosExistentes = await cargarEntrenos();
        if (!entrenosExistentes || entrenosExistentes.length === 0) {
            await guardarEntrenos(entrenosEjemplo);
            console.log('Datos de ejemplo guardados en Firestore');
            return entrenosEjemplo;
        }
        console.log('Datos cargados desde Firestore');
        return entrenosExistentes;
    } catch (error) {
        console.error('Error al inicializar datos:', error);
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
        console.error('Error al subir imagen a Storage:', error);
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
        console.warn('Error al extraer ruta de URL de Storage:', error);
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
            console.warn('No se pudo extraer la ruta del archivo de la URL:', imageUrl);
            return; // No es una URL válida de Firebase Storage
        }
        
        // Crear referencia y eliminar
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
        console.log('Imagen eliminada de Storage:', filePath);
    } catch (error) {
        // Si el error es que el objeto no existe, solo registrar una advertencia
        if (error.code === 'storage/object-not-found' || error.message?.includes('object-not-found')) {
            console.warn('La imagen no se encontró en Storage (puede que ya haya sido eliminada):', imageUrl);
        } else {
            console.warn('Error al eliminar imagen de Storage (no crítico):', error);
        }
        // No lanzar error - permitir que la función continúe
    }
}

// Función para obtener ejercicios de un entreno específico
// entrenoId puede ser el ID numérico o el firestoreId. Si es numérico, lo convertimos.
export async function obtenerEjerciciosDeEntreno(entrenoId) {
    try {
        // Si entrenoId es numérico, necesitamos obtener el firestoreId primero
        let firestoreId = entrenoId;
        if (typeof entrenoId === 'number' || /^\d+$/.test(entrenoId)) {
            const entrenos = await cargarEntrenos();
            const entreno = entrenos?.find(e => e.id === parseInt(entrenoId));
            if (!entreno || !entreno.firestoreId) {
                console.error('Entreno no encontrado o sin firestoreId');
                return [];
            }
            firestoreId = entreno.firestoreId;
        }
        
        const ejerciciosCollection = collection(db, `entrenos/${firestoreId}/ejercicios`);
        const q = query(ejerciciosCollection, orderBy('id', 'asc'));
        const snapshot = await getDocs(q);
        
        const ejercicios = [];
        snapshot.forEach(docSnapshot => {
            const data = docSnapshot.data();
            ejercicios.push({
                id: data.id,
                nombre: data.nombre,
                imagenUrl: data.imagenUrl,
                // Mantener compatibilidad con código existente que usa imagenBase64
                imagenBase64: data.imagenUrl,
                registros: data.registros || []
            });
        });
        
        return ejercicios;
    } catch (error) {
        console.error('Error al cargar ejercicios desde Firestore:', error);
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
        
        // Preparar datos del ejercicio para Firestore
        const ejercicioData = {
            id: ejercicio.id,
            nombre: ejercicio.nombre,
            imagenUrl: imagenUrl,
            registros: ejercicio.registros || []
        };
        
        // Agregar a Firestore usando el firestoreId
        const ejerciciosCollection = collection(db, `entrenos/${firestoreId}/ejercicios`);
        await addDoc(ejerciciosCollection, ejercicioData);
        
        console.log('Ejercicio agregado a Firestore');
    } catch (error) {
        console.error('Error al agregar ejercicio a Firestore:', error);
        throw error;
    }
}

// Función para eliminar ejercicio de un entreno
export async function eliminarEjercicioDeEntreno(entrenoId, ejercicioId) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Primero obtener el ejercicio para eliminar su imagen
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        
        // Intentar eliminar la imagen si existe (no crítico si falla)
        if (ejercicio && ejercicio.imagenUrl) {
            try {
                await eliminarImagenDeStorage(ejercicio.imagenUrl);
            } catch (error) {
                // Si la eliminación de la imagen falla, solo registrar una advertencia
                // pero continuar con la eliminación del ejercicio
                console.warn('La imagen no se pudo eliminar, pero el ejercicio se eliminará:', error);
            }
        }
        
        // Buscar el documento en Firestore
        const ejerciciosCollection = collection(db, `entrenos/${firestoreId}/ejercicios`);
        const snapshot = await getDocs(ejerciciosCollection);
        
        let docId = null;
        snapshot.forEach(docSnapshot => {
            if (docSnapshot.data().id === ejercicioId) {
                docId = docSnapshot.id;
            }
        });
        
        if (docId) {
            await deleteDoc(doc(db, `entrenos/${firestoreId}/ejercicios/${docId}`));
            console.log('Ejercicio eliminado de Firestore');
        } else {
            throw new Error('Ejercicio no encontrado en Firestore');
        }
    } catch (error) {
        console.error('Error al eliminar ejercicio de Firestore:', error);
        throw error;
    }
}

// Función para actualizar ejercicio en un entreno
export async function actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        // Buscar el documento en Firestore
        const ejerciciosCollection = collection(db, `entrenos/${firestoreId}/ejercicios`);
        const snapshot = await getDocs(ejerciciosCollection);
        
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
        const ejercicioRef = doc(db, `entrenos/${firestoreId}/ejercicios/${docId}`);
        await updateDoc(ejercicioRef, {
            nombre: ejercicioActualizado.nombre,
            imagenUrl: imagenUrl,
            registros: ejercicioActualizado.registros || ejercicioExistente.registros || []
        });
        
        console.log('Ejercicio actualizado en Firestore');
    } catch (error) {
        console.error('Error al actualizar ejercicio en Firestore:', error);
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
        console.error('Error al obtener ejercicio:', error);
        return null;
    }
}

// Función para agregar registro a un ejercicio
export async function agregarRegistroAEjercicio(entrenoId, ejercicioId, nuevoRegistro) {
    try {
        // Obtener el ejercicio actual
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // Agregar ID único al registro
        nuevoRegistro.id = Date.now();
        
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
        
        return true;
    } catch (error) {
        console.error('Error al agregar registro:', error);
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
        
        return true;
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        throw error;
    }
}

// Función para actualizar registro en un ejercicio
export async function actualizarRegistroEnEjercicio(entrenoId, ejercicioId, registroId, datosActualizados) {
    try {
        // Obtener el ejercicio actual
        const ejercicio = await obtenerEjercicio(entrenoId, ejercicioId);
        if (!ejercicio) {
            throw new Error('Ejercicio no encontrado');
        }
        
        // Mantener el ID original
        datosActualizados.id = registroId;
        
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
        
        return true;
    } catch (error) {
        console.error('Error al actualizar registro:', error);
        throw error;
    }
}

// Función para reordenar ejercicios
export async function reordenarEjercicios(entrenoId, draggedId, targetId) {
    try {
        // Obtener el firestoreId del entreno
        const firestoreId = await obtenerFirestoreIdDeEntreno(entrenoId);
        
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoId);
        
        // Encontrar los índices de los ejercicios
        const draggedIndex = ejercicios.findIndex(e => e.id === draggedId);
        const targetIndex = ejercicios.findIndex(e => e.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            return false;
        }
        
        // Si son el mismo, no hacer nada
        if (draggedIndex === targetIndex) {
            return true;
        }
        
        // Remover el ejercicio arrastrado del array
        const [ejercicioArrastrado] = ejercicios.splice(draggedIndex, 1);
        
        // Insertar el ejercicio arrastrado en la nueva posición
        ejercicios.splice(targetIndex, 0, ejercicioArrastrado);
        
        // Actualizar el orden en Firestore
        // Necesitamos actualizar cada ejercicio con un campo de orden
        // Por ahora, simplemente re-guardamos todos los ejercicios en el nuevo orden
        // Esto es ineficiente pero funcional. Una mejor solución sería usar un campo 'orden'
        const ejerciciosCollection = collection(db, `entrenos/${firestoreId}/ejercicios`);
        const snapshot = await getDocs(ejerciciosCollection);
        
        // Eliminar todos los ejercicios
        const deletePromises = snapshot.docs.map(docSnapshot => 
            deleteDoc(doc(db, `entrenos/${firestoreId}/ejercicios/${docSnapshot.id}`))
        );
        await Promise.all(deletePromises);
        
        // Agregar todos los ejercicios en el nuevo orden
        const addPromises = ejercicios.map(ejercicio => {
            const ejercicioData = {
                id: ejercicio.id,
                nombre: ejercicio.nombre,
                imagenUrl: ejercicio.imagenUrl,
                registros: ejercicio.registros || []
            };
            return addDoc(ejerciciosCollection, ejercicioData);
        });
        await Promise.all(addPromises);
        
        return true;
    } catch (error) {
        console.error('Error al reordenar ejercicios:', error);
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
