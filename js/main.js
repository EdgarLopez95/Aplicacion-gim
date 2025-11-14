// main.js - Orquestación principal de la aplicación

import {
    cargarEntrenos,
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
    mostrarModalRegistro,
    ocultarModalRegistro,
    showConfirmationModal,
    poblarFormularioEjercicio,
    obtenerValoresFormulario,
    configurarModalNuevoEjercicio,
    configurarModalEditarEjercicio,
    getDashboardView,
    getEntrenoView,
    getEjercicioView,
    getModalNuevoEjercicio,
    getFormNuevoEjercicio,
    getBtnAnadirEjercicio,
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
    const btnAnadir = getBtnAnadirEjercicio();
    btnCancelarEjercicio = document.getElementById('btn-cancelar-ejercicio');
    const formNuevoEjercicio = getFormNuevoEjercicio();
    const modalNuevoEjercicio = getModalNuevoEjercicio();
    
    // Asignar event listeners (el HTML se regenera cada vez, así que no hay duplicados)
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
    let touchStartY = null;
    let touchOffsetY = null;
    let initialY = null;
    
    // Event listener para dragstart - ahora escucha el drag handle
    listaEjercicios.addEventListener('dragstart', function(e) {
        // Solo permitir drag en el drag handle
        if (e.target.classList.contains('drag-handle')) {
            // Obtener la tarjeta padre que contiene el handle
            draggedElement = e.target.closest('.ejercicio-card');
            if (draggedElement) {
                draggedId = parseInt(draggedElement.dataset.ejercicioId);
                draggedElement.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', draggedElement.innerHTML);
            }
        }
    });
    
    // Event listener para dragend
    listaEjercicios.addEventListener('dragend', function(e) {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
            draggedElement.style.transform = '';
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
        
        if (!dragging) {
            return;
        }
        
        if (afterElement == null) {
            listaEjercicios.appendChild(dragging);
        } else {
            // CORRECCIÓN: asegurarse de que afterElement es un elemento DOM válido
            if (afterElement && afterElement.parentNode) {
                listaEjercicios.insertBefore(dragging, afterElement);
            }
        }
    });
    
    // Event listener para drop
    listaEjercicios.addEventListener('drop', async function(e) {
        e.preventDefault();
        
        if (!draggedId || !entrenoActual || !draggedElement) {
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
            await reordenarEjercicios(entrenoActual.id, draggedId, targetId);
            
            // Re-renderizar la lista de ejercicios
            const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
            renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
            
            // Re-configurar los event listeners (incluyendo drag and drop)
            configurarDragAndDropEjercicios();
            
            console.log('Ejercicios reordenados');
        } catch (error) {
            console.error('Error al reordenar ejercicios:', error);
        }
    });
    
    // ========== SOPORTE TÁCTIL PARA MÓVILES ==========
    
    // Event listener para touchstart
    listaEjercicios.addEventListener('touchstart', function(e) {
        const handle = e.target.closest('.drag-handle');
        if (!handle) {
            return;
        }
        
        e.preventDefault();
        
        // Obtener la tarjeta padre que contiene el handle
        draggedElement = handle.closest('.ejercicio-card');
        if (draggedElement) {
            draggedId = parseInt(draggedElement.dataset.ejercicioId);
            draggedElement.classList.add('dragging');
            
            // Guardar posición inicial del touch
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            initialY = draggedElement.getBoundingClientRect().top;
            touchOffsetY = touch.clientY - initialY;
        }
    }, { passive: false });
    
    // Event listener para touchmove
    listaEjercicios.addEventListener('touchmove', function(e) {
        if (!draggedElement || touchStartY === null) {
            return;
        }
        
        e.preventDefault();
        
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const deltaY = currentY - touchStartY;
        
        // Mover visualmente la tarjeta
        draggedElement.style.transform = `translateY(${deltaY}px)`;
        draggedElement.style.transition = 'none';
        
        // Encontrar el elemento sobre el que se está "flotando"
        const afterElement = getDragAfterElement(listaEjercicios, currentY);
        const dragging = listaEjercicios.querySelector('.dragging');
        
        if (!dragging) {
            return;
        }
        
        // Reordenar visualmente
        if (afterElement == null) {
            if (dragging.nextSibling) {
                listaEjercicios.appendChild(dragging);
            }
        } else {
            if (afterElement && afterElement.parentNode && afterElement !== dragging) {
                listaEjercicios.insertBefore(dragging, afterElement);
            }
        }
    }, { passive: false });
    
    // Event listener para touchend
    listaEjercicios.addEventListener('touchend', async function(e) {
        if (!draggedElement || !draggedId || touchStartY === null) {
            return;
        }
        
        e.preventDefault();
        
        // Quitar el transform
        draggedElement.style.transform = '';
        draggedElement.style.transition = '';
        
        // Encontrar el elemento sobre el que se soltó
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetCard = elementBelow?.closest('.ejercicio-card');
        
        if (!targetCard || !entrenoActual) {
            // Resetear estado
            draggedElement.classList.remove('dragging');
            draggedElement = null;
            draggedId = null;
            touchStartY = null;
            touchOffsetY = null;
            initialY = null;
            return;
        }
        
        const targetId = parseInt(targetCard.dataset.ejercicioId);
        
        // Si es el mismo elemento, no hacer nada
        if (targetId === draggedId) {
            draggedElement.classList.remove('dragging');
            draggedElement = null;
            draggedId = null;
            touchStartY = null;
            touchOffsetY = null;
            initialY = null;
            return;
        }
        
        // Reordenar en storage
        try {
            await reordenarEjercicios(entrenoActual.id, draggedId, targetId);
            
            // Re-renderizar la lista de ejercicios
            const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
            renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
            
            // Re-configurar los event listeners (incluyendo drag and drop)
            configurarDragAndDropEjercicios();
            
            console.log('Ejercicios reordenados (táctil)');
        } catch (error) {
            console.error('Error al reordenar ejercicios:', error);
        } finally {
            // Resetear estado
            draggedElement = null;
            draggedId = null;
            touchStartY = null;
            touchOffsetY = null;
            initialY = null;
        }
    }, { passive: false });
}

// Función auxiliar para encontrar el elemento después del cual insertar
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.ejercicio-card:not(.dragging)')];
    
    if (draggableElements.length === 0) {
        return null;
    }
    
    const result = draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY });
    
    return result.element || null;
}

// Función para manejar el submit del formulario
async function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const form = e.target;
    const boton = form.querySelector('button[type="submit"]');
    
    // Validación: nombre es obligatorio (antes de mostrar spinner)
    const { nombre, archivoImagen } = obtenerValoresFormulario();
    if (!nombre) {
        alert('Por favor, ingresa el nombre del ejercicio');
        return;
    }
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
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
                const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
                const ejercicioExistente = ejercicios.find(e => e.id === currentlyEditingId);
                if (ejercicioExistente) {
                    imagenBase64 = ejercicioExistente.imagenBase64 || ejercicioExistente.imagenUrl;
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
            
            // 2. GUARDAR LOS DATOS
            await actualizarEjercicioEnEntreno(entrenoActual.id, ejercicioActualizado);
            console.log('Ejercicio actualizado:', ejercicioActualizado);
            
        } else {
            // ESTAMOS CREANDO UN NUEVO EJERCICIO
            if (!archivoImagen) {
                alert('Por favor, selecciona una imagen');
                return;
            }
            
            // Procesar imagen (ahora devuelve el archivo directamente para subirlo a Storage)
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
                imagenBase64: imagenBase64 // Ahora es el archivo File
            };
            
            // 2. GUARDAR LOS DATOS
            await agregarEjercicioAEntreno(entrenoActual.id, nuevoEjercicio);
            console.log('Ejercicio agregado:', nuevoEjercicio);
        }
        
        // 3. RENDERIZAR LOS EJERCICIOS (LO MÁS IMPORTANTE)
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
        renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
        
        // Resetear el ID de edición
        currentlyEditingId = null;
        
        // 4. CERRAR EL MODAL
        ocultarModal();
        
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al guardar:', error);
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para mostrar la vista de entreno con los datos del entreno seleccionado
async function mostrarVistaEntreno(entreno) {
    entrenoActual = entreno;
    
    // 1. Renderizar la vista completa
    const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
    renderizarEntrenoView(entreno, ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
    
    // 2. Mostrar la vista
    showView(getEntrenoView());
    
    // 3. Re-asignar event listeners
    configurarEventListenersEntrenoView();
}

// Función para mostrar la vista de ejercicio (registro de progreso)
async function mostrarVistaEjercicio(ejercicioId) {
    if (!entrenoActual) {
        console.error('No hay entreno actual');
        return;
    }
    
    // Obtener el ejercicio
    const ejercicio = await obtenerEjercicio(entrenoActual.id, ejercicioId);
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
    const formNuevoRegistro = getFormNuevoRegistro();
    const btnAbrirModalRegistro = document.getElementById('btn-abrir-modal-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    
    // Botón para abrir modal de registro
    if (btnAbrirModalRegistro) {
        btnAbrirModalRegistro.addEventListener('click', function() {
            // Resetear el estado de edición
            currentlyEditingRegistroId = null;
            // Resetear el formulario y abrir el modal
            ocultarModalRegistro(); // Primero resetear
            setTimeout(() => {
                mostrarModalRegistro();
            }, 10);
        });
    }
    
    // Botón cancelar del modal
    if (btnCancelarRegistro) {
        btnCancelarRegistro.addEventListener('click', function() {
            // Resetear el estado de edición
            currentlyEditingRegistroId = null;
            ocultarModalRegistro();
        });
    }
    
    // Formulario de nuevo registro
    if (formNuevoRegistro) {
        formNuevoRegistro.addEventListener('submit', manejarSubmitRegistro);
    }
}

// Función para manejar el submit del formulario de registro
async function manejarSubmitRegistro(e) {
    e.preventDefault();
    
    if (!entrenoActual || !ejercicioActual) {
        console.error('No hay entreno o ejercicio actual');
        return;
    }
    
    const form = e.target;
    const boton = form.querySelector('button[type="submit"]');
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
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // Crear objeto de registro
        const datosRegistro = {
            fecha: fecha,
            series: series,
            notas: notas || ''
        };
        
        // 2. Hacer el trabajo
        if (currentlyEditingRegistroId !== null) {
            // ESTAMOS EDITANDO
            await actualizarRegistroEnEjercicio(entrenoActual.id, ejercicioActual.id, currentlyEditingRegistroId, datosRegistro);
            console.log('Registro actualizado:', datosRegistro);
        } else {
            // ESTAMOS CREANDO UN NUEVO REGISTRO
            await agregarRegistroAEjercicio(entrenoActual.id, ejercicioActual.id, datosRegistro);
            console.log('Registro guardado:', datosRegistro);
        }
        
        // Actualizar el ejercicio actual con los nuevos registros
        ejercicioActual = await obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
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
        if (boton) {
            boton.textContent = 'Guardar Registro';
        }
        
        // Cerrar el modal después de guardar
        ocultarModalRegistro();
        
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al guardar el registro:', error);
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
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
    
    // Abrir el modal para editar
    mostrarModalRegistro();
}

// Función para eliminar un registro
async function eliminarRegistro(registroId, botonElement) {
    if (!entrenoActual || !ejercicioActual) {
        console.error('No hay entreno o ejercicio actual');
        return;
    }
    
    const confirmed = await showConfirmationModal('Eliminar Registro', '¿Estás seguro de que quieres eliminar este registro?');
    if (!confirmed) {
        return;
    }
    
    // Usar el botón pasado como parámetro, o intentar encontrarlo como fallback
    const boton = botonElement || document.querySelector(`.btn-eliminar-registro[data-registro-id="${registroId}"]`);
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // 2. Hacer el trabajo
        await eliminarRegistroDeEjercicio(entrenoActual.id, ejercicioActual.id, registroId);
        
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
        ejercicioActual = await obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
        const registros = ejercicioActual.registros || [];
        
        // Actualizar la lista de registros
        renderizarListaRegistros(registros, editarRegistro, eliminarRegistro);
        
        console.log('Registro eliminado:', registroId);
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al eliminar el registro:', error);
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para eliminar un ejercicio
async function eliminarEjercicio(ejercicioId, botonElement) {
    const confirmed = await showConfirmationModal('Eliminar Ejercicio', '¿Estás seguro de que quieres eliminar este ejercicio?');
    if (!confirmed) {
        return;
    }
    
    // Usar el botón pasado como parámetro, o intentar encontrarlo como fallback
    const boton = botonElement || document.querySelector(`.btn-eliminar[data-ejercicio-id="${ejercicioId}"]`);
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // 2. Hacer el trabajo
        await eliminarEjercicioDeEntreno(entrenoActual.id, ejercicioId);
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
        renderizarEjercicios(ejercicios, editarEjercicio, eliminarEjercicio, mostrarVistaEjercicio);
        console.log('Ejercicio eliminado:', ejercicioId);
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al eliminar el ejercicio:', error);
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para editar un ejercicio
async function editarEjercicio(ejercicioId) {
    const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
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
async function initApp() {
    try {
        // Cargar entrenos desde Firestore
        const entrenos = await cargarEntrenos() || [];
        
        // Renderizar la vista completa del dashboard
        renderizarDashboardView(entrenos, mostrarVistaEntreno);
        
        // Asegurar que solo el dashboard esté visible al cargar
        showView(getDashboardView());
        
        // Configurar botón "Volver" del header principal
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', function() {
                // Si estamos en la vista de ejercicio, volver a la vista de entreno
                const ejercicioView = document.getElementById('ejercicio-view');
                if (ejercicioView && ejercicioView.classList.contains('active')) {
                    if (entrenoActual) {
                        mostrarVistaEntreno(entrenoActual);
                    } else {
                        showView(getDashboardView());
                    }
                } else {
                    // Si estamos en la vista de entreno, volver al dashboard
                    showView(getDashboardView());
                }
            });
        }
        
        // NOTA: Los event listeners de la vista de entreno (botones, modal, formulario)
        // se configuran en configurarEventListenersEntrenoView(), que se llama
        // después de renderizar la vista de entreno en mostrarVistaEntreno()
        
        console.log('Aplicación inicializada correctamente');
        
        // Registrar el Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration);
                })
                .catch(error => {
                    console.error('Error al registrar el Service Worker:', error);
                });
        }
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    } finally {
        // Ocultar el loader global
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado');
    initApp();
});

