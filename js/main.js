// main.js - Orquestación principal de la aplicación

import {
    inicializarDatos,
    obtenerEjerciciosDeEntreno,
    obtenerEjercicio,
    agregarEjercicioAEntreno,
    eliminarEjercicioDeEntreno,
    actualizarEjercicioEnEntreno,
    agregarRegistroAEjercicio,
    eliminarRegistroDeEjercicio,
    actualizarRegistroEnEjercicio,
    reordenarEjercicios,
    convertirImagenABase64
} from './storage.js';

import {
    showView,
    renderizarDashboardView,
    renderizarEntrenoView,
    renderizarEjercicios,
    renderizarEjercicioView,
    renderizarListaRegistros,
    mostrarModal,
    ocultarModal,
    poblarFormularioEjercicio,
    obtenerValoresFormulario,
    configurarModalNuevoEjercicio,
    configurarModalEditarEjercicio,
    getDashboardView,
    getEntrenoView,
    getEjercicioView,
    getModalNuevoEjercicio,
    getFormNuevoEjercicio,
    getBtnVolverDashboard,
    getBtnAnadirEjercicio,
    getBtnVolverEntreno,
    getFormNuevoRegistro
} from './ui.js';

// Referencia al botón cancelar (está en el HTML del modal)
let btnCancelarEjercicio = null;

// Variables de estado
let entrenoActual = null;
let ejercicioActual = null;
let currentlyEditingId = null;
let currentlyEditingRegistroId = null;

// Función para configurar event listeners de la vista de entreno
function configurarEventListenersEntrenoView() {
    const btnVolver = getBtnVolverDashboard();
    const btnAnadir = getBtnAnadirEjercicio();
    btnCancelarEjercicio = document.getElementById('btn-cancelar-ejercicio');
    const formNuevoEjercicio = getFormNuevoEjercicio();
    const modalNuevoEjercicio = getModalNuevoEjercicio();
    
    // Asignar event listeners (el HTML se regenera cada vez, así que no hay duplicados)
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            showView(getDashboardView());
        });
    }
    
    if (btnAnadir) {
        btnAnadir.addEventListener('click', function() {
            // Resetear el ID de edición a null para crear un nuevo ejercicio
            currentlyEditingId = null;
            
            // Configurar el modal para nuevo ejercicio
            configurarModalNuevoEjercicio();
            
            // Mostrar el modal
            mostrarModal();
        });
    }
    
    if (btnCancelarEjercicio) {
        btnCancelarEjercicio.addEventListener('click', function() {
            currentlyEditingId = null;
            ocultarModal();
        });
    }
    
    // Event listener del formulario
    if (formNuevoEjercicio) {
        formNuevoEjercicio.addEventListener('submit', manejarSubmitFormulario);
    }
    
    // Cerrar modal al hacer clic fuera de él
    if (modalNuevoEjercicio) {
        modalNuevoEjercicio.addEventListener('click', function(e) {
            if (e.target === modalNuevoEjercicio) {
                currentlyEditingId = null;
                ocultarModal();
            }
        });
    }
    
    // Configurar drag and drop para reordenar ejercicios
    configurarDragAndDropEjercicios();
}

// Función para configurar drag and drop de ejercicios
function configurarDragAndDropEjercicios() {
    const listaEjercicios = document.getElementById('lista-ejercicios');
    if (!listaEjercicios) {
        return;
    }
    
    let draggedElement = null;
    let draggedId = null;
    
    // Event listener para dragstart
    listaEjercicios.addEventListener('dragstart', function(e) {
        // Solo permitir drag en las tarjetas de ejercicio, no en los botones
        if (e.target.closest('.ejercicio-card')) {
            draggedElement = e.target.closest('.ejercicio-card');
            draggedId = parseInt(draggedElement.dataset.ejercicioId);
            draggedElement.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedElement.innerHTML);
        }
    });
    
    // Event listener para dragend
    listaEjercicios.addEventListener('dragend', function(e) {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
            draggedId = null;
        }
    });
    
    // Event listener para dragover
    listaEjercicios.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Encontrar el elemento sobre el que se está arrastrando
        const afterElement = getDragAfterElement(listaEjercicios, e.clientY);
        const dragging = listaEjercicios.querySelector('.dragging');
        
        if (afterElement == null) {
            listaEjercicios.appendChild(dragging);
        } else {
            listaEjercicios.insertBefore(dragging, afterElement);
        }
    });
    
    // Event listener para drop
    listaEjercicios.addEventListener('drop', function(e) {
        e.preventDefault();
        
        if (!draggedId || !entrenoActual) {
            return;
        }
        
        // Encontrar el elemento sobre el que se soltó
        const targetCard = e.target.closest('.ejercicio-card');
        if (!targetCard) {
            return;
        }
        
        const targetId = parseInt(targetCard.dataset.ejercicioId);
        
        // Si es el mismo elemento, no hacer nada
        if (targetId === draggedId) {
            return;
        }
        
        // Reordenar en storage
        try {
            reordenarEjercicios(entrenoActual.id, draggedId, targetId);
            
            // Re-renderizar la lista de ejercicios
            const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
            renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
            
            // Re-configurar los event listeners (incluyendo drag and drop)
            configurarDragAndDropEjercicios();
            
            console.log('Ejercicios reordenados');
        } catch (error) {
            console.error('Error al reordenar ejercicios:', error);
            alert('Error al reordenar los ejercicios. Por favor, intenta de nuevo.');
        }
    });
}

// Función auxiliar para encontrar el elemento después del cual insertar
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ejercicio-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Función para manejar el submit del formulario
async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const { nombre, archivoImagen } = obtenerValoresFormulario();
    
    // Validación: nombre es obligatorio
    if (!nombre) {
        alert('Por favor, ingresa el nombre del ejercicio');
        return;
    }
    
    let imagenBase64 = null;
    
    // Verificar si estamos editando o creando
    if (currentlyEditingId !== null) {
        // ESTAMOS EDITANDO
        if (archivoImagen) {
            // Hay una nueva imagen, convertirla a Base64
            try {
                imagenBase64 = await convertirImagenABase64(archivoImagen);
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                alert(error.message || 'Error al procesar la imagen. Por favor, intenta de nuevo.');
                return;
            }
        } else {
            // No hay nueva imagen, conservar la imagen anterior
            const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
            const ejercicioExistente = ejercicios.find(e => e.id === currentlyEditingId);
            if (ejercicioExistente) {
                imagenBase64 = ejercicioExistente.imagenBase64;
            } else {
                alert('Error: No se encontró el ejercicio a editar');
                return;
            }
        }
        
        // Actualizar ejercicio existente
        const ejercicioActualizado = {
            id: currentlyEditingId,
            nombre: nombre,
            imagenBase64: imagenBase64
        };
        
        // 1. GUARDAR LOS DATOS
        try {
            actualizarEjercicioEnEntreno(entrenoActual.id, ejercicioActualizado);
            console.log('Ejercicio actualizado:', ejercicioActualizado);
        } catch (error) {
            alert(error.message || 'Error al guardar el ejercicio. Por favor, intenta de nuevo.');
            return;
        }
        
    } else {
        // ESTAMOS CREANDO UN NUEVO EJERCICIO
        if (!archivoImagen) {
            alert('Por favor, selecciona una imagen');
            return;
        }
        
        // Convertir imagen a Base64
        try {
            imagenBase64 = await convertirImagenABase64(archivoImagen);
        } catch (error) {
            console.error('Error al procesar la imagen:', error);
            alert(error.message || 'Error al procesar la imagen. Por favor, intenta de nuevo.');
            return;
        }
        
        // Crear nuevo ejercicio
        const nuevoEjercicio = {
            id: Date.now(), // ID único basado en timestamp
            nombre: nombre,
            imagenBase64: imagenBase64
        };
        
        // 1. GUARDAR LOS DATOS
        try {
            agregarEjercicioAEntreno(entrenoActual.id, nuevoEjercicio);
            console.log('Ejercicio agregado:', nuevoEjercicio);
        } catch (error) {
            alert(error.message || 'Error al guardar el ejercicio. Por favor, intenta de nuevo.');
            return;
        }
    }
    
    // 2. RENDERIZAR LOS EJERCICIOS (LO MÁS IMPORTANTE)
    const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
    renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
    
    // Resetear el ID de edición
    currentlyEditingId = null;
    
    // 3. CERRAR EL MODAL
    ocultarModal();
}

// Función para mostrar la vista de entreno con los datos del entreno seleccionado
function mostrarVistaEntreno(entreno) {
    entrenoActual = entreno;
    
    // 1. Renderizar la vista completa
    const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
    renderizarEntrenoView(entreno, ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
    
    // 2. Mostrar la vista
    showView(getEntrenoView());
    
    // 3. Re-asignar event listeners
    configurarEventListenersEntrenoView();
}

// Función para mostrar la vista de ejercicio (registro de progreso)
function mostrarVistaEjercicio(ejercicioId) {
    if (!entrenoActual) {
        console.error('No hay entreno actual');
        return;
    }
    
    // Obtener el ejercicio
    const ejercicio = obtenerEjercicio(entrenoActual.id, ejercicioId);
    if (!ejercicio) {
        console.error('Ejercicio no encontrado');
        return;
    }
    
    ejercicioActual = ejercicio;
    
    // Obtener registros (si existen)
    const registros = ejercicio.registros || [];
    
    // Resetear el ID de edición de registro
    currentlyEditingRegistroId = null;
    
    // 1. Renderizar la vista completa
    renderizarEjercicioView(ejercicio, registros, editarRegistro, eliminarRegistro);
    
    // 2. Mostrar la vista
    showView(getEjercicioView());
    
    // 3. Configurar event listeners
    configurarEventListenersEjercicioView();
}

// Función para configurar event listeners de la vista de ejercicio
function configurarEventListenersEjercicioView() {
    const btnVolver = getBtnVolverEntreno();
    const formNuevoRegistro = getFormNuevoRegistro();
    
    // Botón volver
    if (btnVolver) {
        btnVolver.addEventListener('click', function() {
            // Volver a la vista de entreno
            mostrarVistaEntreno(entrenoActual);
        });
    }
    
    // Formulario de nuevo registro
    if (formNuevoRegistro) {
        formNuevoRegistro.addEventListener('submit', manejarSubmitRegistro);
    }
}

// Función para manejar el submit del formulario de registro
function manejarSubmitRegistro(e) {
    e.preventDefault();
    
    if (!entrenoActual || !ejercicioActual) {
        console.error('No hay entreno o ejercicio actual');
        return;
    }
    
    const form = e.target;
    const fecha = form.querySelector('#fecha-registro').value;
    const notas = form.querySelector('#notas-registro').value.trim();
    
    // Recopilar series
    const series = [];
    for (let i = 1; i <= 4; i++) {
        const peso = parseFloat(form.querySelector(`#peso-serie-${i}`).value);
        const repeticiones = parseInt(form.querySelector(`#rep-serie-${i}`).value);
        
        if (peso && repeticiones) {
            series.push({ peso, repeticiones });
        }
    }
    
    // Validar que haya al menos una serie
    if (series.length === 0) {
        alert('Por favor, completa al menos una serie con peso y repeticiones');
        return;
    }
    
    // Crear objeto de registro
    const datosRegistro = {
        fecha: fecha,
        series: series,
        notas: notas || ''
    };
    
    try {
        if (currentlyEditingRegistroId !== null) {
            // ESTAMOS EDITANDO
            actualizarRegistroEnEjercicio(entrenoActual.id, ejercicioActual.id, currentlyEditingRegistroId, datosRegistro);
            console.log('Registro actualizado:', datosRegistro);
        } else {
            // ESTAMOS CREANDO UN NUEVO REGISTRO
            agregarRegistroAEjercicio(entrenoActual.id, ejercicioActual.id, datosRegistro);
            console.log('Registro guardado:', datosRegistro);
        }
        
        // Actualizar el ejercicio actual con los nuevos registros
        ejercicioActual = obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
        const registros = ejercicioActual.registros || [];
        
        // Actualizar la lista de registros
        renderizarListaRegistros(registros, editarRegistro, eliminarRegistro);
        
        // Limpiar el formulario
        form.reset();
        
        // Restaurar la fecha a hoy
        form.querySelector('#fecha-registro').value = new Date().toISOString().split('T')[0];
        
        // Resetear el ID de edición
        currentlyEditingRegistroId = null;
        
        // Cambiar el texto del botón de vuelta a "Guardar Registro"
        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = 'Guardar Registro';
        }
        
    } catch (error) {
        console.error('Error al guardar el registro:', error);
        alert('Error al guardar el registro. Por favor, intenta de nuevo.');
    }
}

// Función para editar un registro
function editarRegistro(registroId) {
    if (!entrenoActual || !ejercicioActual) {
        console.error('No hay entreno o ejercicio actual');
        return;
    }
    
    // Obtener el registro
    const registros = ejercicioActual.registros || [];
    const registro = registros.find(r => r.id === registroId);
    
    if (!registro) {
        console.error('Registro no encontrado');
        return;
    }
    
    // Guardar el ID del registro que se está editando
    currentlyEditingRegistroId = registroId;
    
    // Poblar el formulario con los datos del registro
    const form = document.getElementById('form-nuevo-registro');
    if (!form) {
        console.error('Formulario no encontrado');
        return;
    }
    
    // Fecha
    const fechaInput = form.querySelector('#fecha-registro');
    if (fechaInput) {
        // Convertir la fecha al formato YYYY-MM-DD
        const fecha = new Date(registro.fecha);
        const fechaFormateada = fecha.toISOString().split('T')[0];
        fechaInput.value = fechaFormateada;
    }
    
    // Series
    const series = registro.series || [];
    for (let i = 1; i <= 4; i++) {
        const serie = series[i - 1];
        const pesoInput = form.querySelector(`#peso-serie-${i}`);
        const repInput = form.querySelector(`#rep-serie-${i}`);
        
        if (pesoInput && repInput) {
            if (serie && serie.peso && serie.repeticiones) {
                pesoInput.value = serie.peso;
                repInput.value = serie.repeticiones;
            } else {
                pesoInput.value = '';
                repInput.value = '';
            }
        }
    }
    
    // Notas
    const notasInput = form.querySelector('#notas-registro');
    if (notasInput) {
        notasInput.value = registro.notas || '';
    }
    
    // Cambiar el texto del botón a "Actualizar Registro"
    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.textContent = 'Actualizar Registro';
    }
    
    // Hacer scroll al formulario
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Función para eliminar un registro
function eliminarRegistro(registroId) {
    if (!entrenoActual || !ejercicioActual) {
        console.error('No hay entreno o ejercicio actual');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
        try {
            eliminarRegistroDeEjercicio(entrenoActual.id, ejercicioActual.id, registroId);
            
            // Si estábamos editando este registro, resetear el ID de edición
            if (currentlyEditingRegistroId === registroId) {
                currentlyEditingRegistroId = null;
                
                // Limpiar el formulario
                const form = document.getElementById('form-nuevo-registro');
                if (form) {
                    form.reset();
                    form.querySelector('#fecha-registro').value = new Date().toISOString().split('T')[0];
                    
                    // Cambiar el texto del botón de vuelta a "Guardar Registro"
                    const btnSubmit = form.querySelector('button[type="submit"]');
                    if (btnSubmit) {
                        btnSubmit.textContent = 'Guardar Registro';
                    }
                }
            }
            
            // Actualizar el ejercicio actual
            ejercicioActual = obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
            const registros = ejercicioActual.registros || [];
            
            // Actualizar la lista de registros
            renderizarListaRegistros(registros, editarRegistro, eliminarRegistro);
            
            console.log('Registro eliminado:', registroId);
        } catch (error) {
            console.error('Error al eliminar el registro:', error);
            alert('Error al eliminar el registro. Por favor, intenta de nuevo.');
        }
    }
}

// Función para eliminar un ejercicio
function eliminarEjercicio(ejercicioId) {
    if (confirm('¿Estás seguro de que quieres eliminar este ejercicio?')) {
        eliminarEjercicioDeEntreno(entrenoActual.id, ejercicioId);
        const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
        renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
        console.log('Ejercicio eliminado:', ejercicioId);
    }
}

// Función para editar un ejercicio
function editarEjercicio(ejercicioId) {
    const ejercicios = obtenerEjerciciosDeEntreno(entrenoActual.id);
    const ejercicio = ejercicios.find(e => e.id === ejercicioId);
    
    if (!ejercicio) {
        console.error('Ejercicio no encontrado');
        return;
    }
    
    // Guardar el ID del ejercicio que se está editando
    currentlyEditingId = ejercicioId;
    
    // Poblar el formulario con los datos del ejercicio
    poblarFormularioEjercicio(ejercicio);
    
    // Configurar el modal para editar
    configurarModalEditarEjercicio();
    
    // Mostrar el modal
    mostrarModal();
}

// Función para inicializar la aplicación
function initApp() {
    // Inicializar datos en LocalStorage (si no existen)
    const entrenos = inicializarDatos();
    
    // Renderizar la vista completa del dashboard
    renderizarDashboardView(entrenos, mostrarVistaEntreno);
    
    // Asegurar que solo el dashboard esté visible al cargar
    showView(getDashboardView());
    
    // NOTA: Los event listeners de la vista de entreno (botones, modal, formulario)
    // se configuran en configurarEventListenersEntrenoView(), que se llama
    // después de renderizar la vista de entreno en mostrarVistaEntreno()
    
    console.log('Aplicación inicializada correctamente');
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    initApp();
});

