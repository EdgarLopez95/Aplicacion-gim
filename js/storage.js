// storage.js - Lógica de LocalStorage

// Claves para LocalStorage
export const STORAGE_KEY = 'gymApp_entrenos';
export const STORAGE_KEY_EJERCICIOS = 'gymApp_ejercicios';

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

// Función para guardar entrenos en LocalStorage
export function guardarEntrenos(entrenos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entrenos));
        console.log('Entrenos guardados en LocalStorage');
    } catch (error) {
        console.error('Error al guardar en LocalStorage:', error);
    }
}

// Función para cargar entrenos desde LocalStorage
export function cargarEntrenos() {
    try {
        const entrenosGuardados = localStorage.getItem(STORAGE_KEY);
        if (entrenosGuardados) {
            return JSON.parse(entrenosGuardados);
        }
        return null;
    } catch (error) {
        console.error('Error al cargar desde LocalStorage:', error);
        return null;
    }
}

// Función para inicializar datos en LocalStorage
export function inicializarDatos() {
    const entrenosExistentes = cargarEntrenos();
    if (!entrenosExistentes || entrenosExistentes.length === 0) {
        guardarEntrenos(entrenosEjemplo);
        console.log('Datos de ejemplo guardados en LocalStorage');
        return entrenosEjemplo;
    }
    console.log('Datos cargados desde LocalStorage');
    return entrenosExistentes;
}

// Función para redimensionar y comprimir imagen
function comprimirImagen(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calcular nuevas dimensiones manteniendo la proporción
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a Base64 con compresión
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para convertir archivo a Base64 (con compresión)
export function convertirImagenABase64(file) {
    // Validar tamaño del archivo (máximo 5MB antes de comprimir)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return Promise.reject(new Error('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.'));
    }

    // Comprimir y convertir a Base64
    return comprimirImagen(file);
}

// Función para guardar ejercicios en LocalStorage
export function guardarEjercicios(ejercicios) {
    try {
        const datosSerializados = JSON.stringify(ejercicios);
        const tamañoEnBytes = new Blob([datosSerializados]).size;
        const tamañoEnMB = tamañoEnBytes / (1024 * 1024);
        
        // Verificar tamaño antes de guardar (LocalStorage tiene límite de ~5-10MB)
        if (tamañoEnMB > 4) {
            throw new Error(`Los datos son demasiado grandes (${tamañoEnMB.toFixed(2)}MB). Por favor, elimina algunos ejercicios o usa imágenes más pequeñas.`);
        }
        
        localStorage.setItem(STORAGE_KEY_EJERCICIOS, datosSerializados);
        console.log(`Ejercicios guardados en LocalStorage (${tamañoEnMB.toFixed(2)}MB)`);
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
            console.error('Error: Se excedió la cuota de LocalStorage');
            throw new Error('No hay suficiente espacio en el almacenamiento. Por favor, elimina algunos ejercicios o usa imágenes más pequeñas.');
        } else if (error.message.includes('demasiado grandes')) {
            throw error;
        } else {
            console.error('Error al guardar ejercicios en LocalStorage:', error);
            throw new Error('Error al guardar los datos. Por favor, intenta de nuevo.');
        }
    }
}

// Función para cargar ejercicios desde LocalStorage
export function cargarEjercicios() {
    try {
        const ejerciciosGuardados = localStorage.getItem(STORAGE_KEY_EJERCICIOS);
        if (ejerciciosGuardados) {
            return JSON.parse(ejerciciosGuardados);
        }
        return {};
    } catch (error) {
        console.error('Error al cargar ejercicios desde LocalStorage:', error);
        return {};
    }
}

// Función para obtener ejercicios de un entreno específico
export function obtenerEjerciciosDeEntreno(entrenoId) {
    const todosLosEjercicios = cargarEjercicios();
    return todosLosEjercicios[entrenoId] || [];
}

// Función para agregar ejercicio a un entreno
export function agregarEjercicioAEntreno(entrenoId, ejercicio) {
    const todosLosEjercicios = cargarEjercicios();
    if (!todosLosEjercicios[entrenoId]) {
        todosLosEjercicios[entrenoId] = [];
    }
    todosLosEjercicios[entrenoId].push(ejercicio);
    guardarEjercicios(todosLosEjercicios);
}

// Función para eliminar ejercicio de un entreno
export function eliminarEjercicioDeEntreno(entrenoId, ejercicioId) {
    const todosLosEjercicios = cargarEjercicios();
    if (todosLosEjercicios[entrenoId]) {
        todosLosEjercicios[entrenoId] = todosLosEjercicios[entrenoId].filter(
            ejercicio => ejercicio.id !== ejercicioId
        );
        guardarEjercicios(todosLosEjercicios);
    }
}

// Función para actualizar ejercicio en un entreno
export function actualizarEjercicioEnEntreno(entrenoId, ejercicioActualizado) {
    const todosLosEjercicios = cargarEjercicios();
    if (todosLosEjercicios[entrenoId]) {
        const index = todosLosEjercicios[entrenoId].findIndex(
            ejercicio => ejercicio.id === ejercicioActualizado.id
        );
        if (index !== -1) {
            todosLosEjercicios[entrenoId][index] = ejercicioActualizado;
            guardarEjercicios(todosLosEjercicios);
        }
    }
}

// Función para obtener un ejercicio específico
export function obtenerEjercicio(entrenoId, ejercicioId) {
    const ejercicios = obtenerEjerciciosDeEntreno(entrenoId);
    return ejercicios.find(e => e.id === ejercicioId) || null;
}

// Función para agregar registro a un ejercicio
export function agregarRegistroAEjercicio(entrenoId, ejercicioId, nuevoRegistro) {
    const todosLosEjercicios = cargarEjercicios();
    if (todosLosEjercicios[entrenoId]) {
        const ejercicio = todosLosEjercicios[entrenoId].find(e => e.id === ejercicioId);
        if (ejercicio) {
            // Inicializar array de registros si no existe
            if (!ejercicio.registros) {
                ejercicio.registros = [];
            }
            
            // Agregar ID único al registro
            nuevoRegistro.id = Date.now();
            
            // Agregar el registro al inicio del array (más reciente primero)
            ejercicio.registros.unshift(nuevoRegistro);
            
            guardarEjercicios(todosLosEjercicios);
            return true;
        }
    }
    return false;
}

// Función para eliminar registro de un ejercicio
export function eliminarRegistroDeEjercicio(entrenoId, ejercicioId, registroId) {
    const todosLosEjercicios = cargarEjercicios();
    if (todosLosEjercicios[entrenoId]) {
        const ejercicio = todosLosEjercicios[entrenoId].find(e => e.id === ejercicioId);
        if (ejercicio && ejercicio.registros) {
            ejercicio.registros = ejercicio.registros.filter(r => r.id !== registroId);
            guardarEjercicios(todosLosEjercicios);
            return true;
        }
    }
    return false;
}

// Función para actualizar registro en un ejercicio
export function actualizarRegistroEnEjercicio(entrenoId, ejercicioId, registroId, datosActualizados) {
    const todosLosEjercicios = cargarEjercicios();
    if (todosLosEjercicios[entrenoId]) {
        const ejercicio = todosLosEjercicios[entrenoId].find(e => e.id === ejercicioId);
        if (ejercicio && ejercicio.registros) {
            const index = ejercicio.registros.findIndex(r => r.id === registroId);
            if (index !== -1) {
                // Mantener el ID original
                datosActualizados.id = registroId;
                ejercicio.registros[index] = datosActualizados;
                guardarEjercicios(todosLosEjercicios);
                return true;
            }
        }
    }
    return false;
}

// Función para reordenar ejercicios
export function reordenarEjercicios(entrenoId, draggedId, targetId) {
    const todosLosEjercicios = cargarEjercicios();
    if (!todosLosEjercicios[entrenoId]) {
        return false;
    }
    
    const ejercicios = todosLosEjercicios[entrenoId];
    
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
    
    // Guardar el array reordenado
    guardarEjercicios(todosLosEjercicios);
    return true;
}

