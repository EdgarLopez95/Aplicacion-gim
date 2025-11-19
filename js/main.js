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
    convertirImagenABase64,
    agregarEjercicioABiblioteca,
    obtenerEjerciciosBiblioteca,
    editarEjercicioBiblioteca,
    eliminarEjercicioBiblioteca,
    agregarCategoria,
    obtenerCategorias,
    editarCategoria,
    eliminarCategoria,
    agregarEjercicioACategoria,
    obtenerEjerciciosDeCategoria,
    editarEjercicioDeCategoria,
    eliminarEjercicioDeCategoria,
    reordenarEjerciciosDeCategoria,
    obtenerTodosLosEjerciciosDeBiblioteca,
    sustituirEjercicioEnEntreno,
    toggleCompletadoEjercicio
} from './storage.js';

import {
    showView,
    renderizarDashboardView,
    renderizarEntrenoView,
    renderizarListaEjercicios,
    renderizarEjercicios,
    renderizarEjercicioView,
    renderizarListaRegistros,
    mostrarModal,
    ocultarModal,
    mostrarModalRegistro,
    ocultarModalRegistro,
    showConfirmationModal,
    showInfoModal,
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
    getFormNuevoRegistro,
    actualizarBreadcrumbs,
    renderizarBibliotecaView,
    renderizarListaBiblioteca,
    renderizarListaCategorias,
    getBibliotecaView,
    renderizarCategoriaEjerciciosView,
    renderizarListaEjerciciosCategoria,
    getCategoriaEjerciciosView,
    renderizarPerfilView,
    renderizarModalSeleccionEjercicio
} from './ui.js';

// Referencia al botón cancelar (está en el HTML del modal)
let btnCancelarEjercicio = null;

// Variables de estado
let entrenoActual = null;
let ejercicioActual = null;
let currentlyEditingId = null;
let ejercicioSustituyendo = null;
let currentlyEditingRegistroId = null;
let currentlyEditingCategoriaId = null;
let currentlyEditingEjercicioCategoriaId = null;
let categoriaActual = null;

// Función para configurar event listeners de la vista de entreno
function configurarEventListenersEntrenoView() {
    const btnAnadir = getBtnAnadirEjercicio();
    btnCancelarEjercicio = document.getElementById('btn-cancelar-ejercicio');
    const formNuevoEjercicio = getFormNuevoEjercicio();
    const modalNuevoEjercicio = getModalNuevoEjercicio();
    
    // Asignar event listeners (el HTML se regenera cada vez, así que no hay duplicados)
    if (btnAnadir) {
        btnAnadir.addEventListener('click', async function() {
            // Resetear el ID de edición a null
            currentlyEditingId = null;
            
            // Paso 1: Mostrar modal inmediatamente con spinner
            renderizarModalSeleccionEjercicio(null);
            const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
            if (modalSeleccion) {
                modalSeleccion.style.display = 'flex';
            }
            
            // Configurar listener básico para cerrar el modal
            const btnCerrar = document.getElementById('btn-cerrar-seleccion');
            if (btnCerrar) {
                btnCerrar.addEventListener('click', function() {
                    modalSeleccion.style.display = 'none';
                });
            }
            
            // Paso 2: Cargar datos en segundo plano
            try {
                const ejerciciosPorCategoria = await obtenerTodosLosEjerciciosDeBiblioteca();
                
                // Paso 3: Actualizar modal con los datos reales
                renderizarModalSeleccionEjercicio(ejerciciosPorCategoria);
                
                // Configurar listeners del modal de selección
                configurarEventListenersModalSeleccion();
            } catch (error) {
                console.error('Error al cargar ejercicios de la biblioteca:', error);
                // Mostrar error en el modal
                const modalContent = modalSeleccion?.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.innerHTML = `
                        <h3>SELECCIONAR EJERCICIO</h3>
                        <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                            Error al cargar los ejercicios de la biblioteca.
                        </p>
                        <div class="modal-buttons">
                            <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                        </div>
                    `;
                    const btnCerrarError = document.getElementById('btn-cerrar-seleccion');
                    if (btnCerrarError) {
                        btnCerrarError.addEventListener('click', function() {
                            modalSeleccion.style.display = 'none';
                        });
                    }
                }
            }
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

// Función para configurar los event listeners del modal de selección
function configurarEventListenersModalSeleccion() {
    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
    if (!modalSeleccion) return;
    
    // Cerrar modal al hacer clic en cancelar
    const btnCerrar = document.getElementById('btn-cerrar-seleccion');
    if (btnCerrar) {
        // Remover listeners anteriores si existen
        const newBtnCerrar = btnCerrar.cloneNode(true);
        btnCerrar.parentNode.replaceChild(newBtnCerrar, btnCerrar);
        
        newBtnCerrar.addEventListener('click', function() {
            modalSeleccion.style.display = 'none';
        });
    }
    
    // Cerrar modal al hacer clic fuera
    modalSeleccion.addEventListener('click', function(e) {
        if (e.target === modalSeleccion) {
            modalSeleccion.style.display = 'none';
        }
    });
    
    // Toggle de categorías (acordeón)
    const categoriaHeaders = modalSeleccion.querySelectorAll('.categoria-seleccion-header');
    categoriaHeaders.forEach(header => {
        // Remover listeners anteriores
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', function() {
            const index = this.dataset.categoriaIndex;
            const ejerciciosContainer = document.getElementById(`ejercicios-categoria-${index}`);
            
            if (ejerciciosContainer) {
                const isVisible = ejerciciosContainer.classList.contains('active');
                
                // Toggle de la clase active
                if (isVisible) {
                    ejerciciosContainer.classList.remove('active');
                    ejerciciosContainer.style.display = 'none';
                    this.classList.remove('active');
                } else {
                    ejerciciosContainer.classList.add('active');
                    ejerciciosContainer.style.display = 'block';
                    this.classList.add('active');
                }
            }
        });
    });
    
    // Seleccionar ejercicio
    const ejercicioItems = modalSeleccion.querySelectorAll('.ejercicio-seleccion-item');
    ejercicioItems.forEach(item => {
        // Remover listeners anteriores
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', async function(e) {
            const tarjeta = e.currentTarget;
            const bibliotecaId = this.dataset.ejercicioId;
            const categoriaId = this.dataset.categoriaId;
            
            // Añadir clase de carga inmediatamente
            tarjeta.classList.add('is-loading');
            
            // Obtener los datos del ejercicio desde la biblioteca
            try {
                // Verificar si el ejercicio ya existe en el entreno actual
                const ejerciciosActuales = await obtenerEjerciciosDeEntreno(entrenoActual.id);
                const ejercicioDuplicado = ejerciciosActuales.find(ej => ej.bibliotecaId === bibliotecaId);
                
                if (ejercicioDuplicado) {
                    tarjeta.classList.remove('is-loading');
                    // Cerrar el modal de selección antes de mostrar el modal de información
                    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
                    if (modalSeleccion) {
                        modalSeleccion.style.display = 'none';
                    }
                    await showInfoModal('Duplicado', 'Este ejercicio ya está en tu entreno.');
                    return;
                }
                
                const ejercicios = await obtenerEjerciciosDeCategoria(categoriaId);
                const ejercicio = ejercicios.find(ej => ej.id === bibliotecaId);
                
                if (!ejercicio || !entrenoActual) {
                    tarjeta.classList.remove('is-loading');
                    // Cerrar el modal de selección antes de mostrar el modal de información
                    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
                    if (modalSeleccion) {
                        modalSeleccion.style.display = 'none';
                    }
                    await showInfoModal('Error', 'Error al obtener los datos del ejercicio');
                    return;
                }
                
                // Preparar datos del ejercicio para agregarlo al entreno
                const ejercicioData = {
                    id: Date.now(), // ID temporal para el entreno
                    nombre: ejercicio.nombre,
                    imagenUrl: ejercicio.imagenUrl,
                    bibliotecaId: bibliotecaId,
                    categoriaId: categoriaId,
                    registros: []
                };
                
                // Agregar ejercicio al entreno
                await agregarEjercicioAEntreno(entrenoActual.id, ejercicioData);
                
                // Cerrar modal
                modalSeleccion.style.display = 'none';
                
                // Refrescar la lista de ejercicios
                const ejerciciosActualizados = await obtenerEjerciciosDeEntreno(entrenoActual.id);
                const onToggle = (id) => toggleCompletado(entrenoActual.id, id);
                renderizarListaEjercicios(ejerciciosActualizados, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
                
                // Re-configurar drag and drop
                configurarDragAndDropEjercicios();
                
                console.log('Ejercicio agregado desde la biblioteca');
            } catch (error) {
                console.error('Error al agregar ejercicio:', error);
                alert('Error al agregar el ejercicio al entreno');
            }
        });
    });
}

// Función para configurar drag and drop de ejercicios
function configurarDragAndDropEjercicios() {
    // Usar lista-ejercicios-container si existe, sino lista-ejercicios (para compatibilidad)
    const listaEjercicios = document.getElementById('lista-ejercicios-container') || document.getElementById('lista-ejercicios');
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
            const onToggle = (id) => toggleCompletado(entrenoActual.id, id);
            renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
            
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
            const onToggle = (id) => toggleCompletado(entrenoActual.id, id);
            renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
            
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
        renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio);
        
        // Re-configurar los event listeners (incluyendo drag and drop)
        configurarDragAndDropEjercicios();
        
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
    const entrenoId = entreno.id; // Capturar el ID explícitamente
    
    // 1. CAMBIA DE VISTA INMEDIATAMENTE (UI Optimista)
    renderizarEntrenoView(entreno); // Pinta el "esqueleto" con el spinner
    showView(getEntrenoView());
    configurarEventListenersEntrenoView(); // Configura el "Volver", "Añadir", etc.
    
    // Actualizar breadcrumbs
    actualizarBreadcrumbs([
        { texto: 'Entrenos', vista: 'dashboard-view' },
        { texto: entreno.nombre }
    ], manejarNavegacionBreadcrumbs);
    
    // Crear función que capture el entrenoId para el toggle
    const onToggle = (ejercicioId) => toggleCompletado(entrenoId, ejercicioId);
    
    // 2. AHORA, busca los datos en segundo plano
    try {
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoId);
        
        // 3. Cuando lleguen, reemplaza el spinner
        renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
        
        // 4. (Importante) Vuelve a configurar los listeners de la lista (drag/edit/delete)
        configurarDragAndDropEjercicios();
        
    } catch (error) {
        // Si falla, reemplaza el spinner con un error
        const listaContainer = document.getElementById('lista-ejercicios-container');
        if (listaContainer) {
            listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error al cargar ejercicios.</p>';
        }
        console.error('Error al cargar ejercicios:', error);
    }
}

// Función para mostrar la vista de biblioteca (ahora para categorías)
async function mostrarVistaBiblioteca() {
    // 1. CAMBIA DE VISTA INMEDIATAMENTE (UI Optimista)
    renderizarBibliotecaView(); // Pinta el "esqueleto" con el spinner
    showView(getBibliotecaView());
    configurarEventListenersBiblioteca(); // Configura el "Añadir", etc.
    
    // 2. AHORA, busca los datos en segundo plano
    try {
        const categorias = await obtenerCategorias();
        
        // 3. Cuando lleguen, reemplaza el spinner
        renderizarListaCategorias(categorias, editarCategoriaHandler, eliminarCategoriaHandler, mostrarVistaCategoriaEjercicios);
        
    } catch (error) {
        // Si falla, reemplaza el spinner con un error
        const listaContainer = document.getElementById('lista-categorias');
        if (listaContainer) {
            listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error al cargar categorías.</p>';
        }
        console.error('Error al cargar categorías:', error);
    }
}

// Función para mostrar la vista de perfil
function mostrarVistaPerfil() {
    renderizarPerfilView();
    showView(document.getElementById('perfil-view'));
}

// Función para configurar los event listeners de la vista de biblioteca (categorías)
function configurarEventListenersBiblioteca() {
    const btnAnadir = document.getElementById('btn-anadir-categoria');
    const btnCancelar = document.getElementById('btn-cancelar-categoria');
    const formCategoria = document.getElementById('form-nueva-categoria');
    const modalCategoria = document.getElementById('modal-nueva-categoria');
    
    // Botón "Añadir Categoría"
    if (btnAnadir) {
        btnAnadir.addEventListener('click', function() {
            currentlyEditingCategoriaId = null; // Resetear ID de edición
            const nombreInput = document.getElementById('nombre-categoria');
            if (nombreInput) {
                nombreInput.value = ''; // Limpiar el campo
            }
            const modalTitulo = document.querySelector('#modal-nueva-categoria h3');
            if (modalTitulo) {
                modalTitulo.textContent = 'Nueva Categoría';
            }
            mostrarModalCategoria();
        });
    }
    
    // Botón "Cancelar"
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            ocultarModalCategoria();
        });
    }
    
    // Formulario
    if (formCategoria) {
        formCategoria.addEventListener('submit', manejarSubmitCategoria);
    }
    
    // Cerrar modal al hacer clic fuera
    if (modalCategoria) {
        modalCategoria.addEventListener('click', function(e) {
            if (e.target === modalCategoria) {
                ocultarModalCategoria();
            }
        });
    }
}

// Función para mostrar el modal de categoría
function mostrarModalCategoria() {
    const modal = document.getElementById('modal-nueva-categoria');
    if (modal) {
        modal.classList.add('active');
    }
}

// Función para ocultar el modal de categoría
function ocultarModalCategoria() {
    const modal = document.getElementById('modal-nueva-categoria');
    if (modal) {
        modal.classList.remove('active');
    }
    
    const form = document.getElementById('form-nueva-categoria');
    if (form) {
        form.reset();
    }
    
    // Resetear el ID de edición
    currentlyEditingCategoriaId = null;
    
    // Restaurar el título del modal
    const modalTitulo = document.querySelector('#modal-nueva-categoria h3');
    if (modalTitulo) {
        modalTitulo.textContent = 'Nueva Categoría';
    }
}

// Función para configurar el modal para nuevo ejercicio
function configurarModalBibliotecaNuevo() {
    const modalTitulo = document.getElementById('modal-biblioteca-titulo');
    const inputImagen = document.getElementById('imagen-biblioteca');
    
    if (modalTitulo) {
        modalTitulo.textContent = 'Nuevo Ejercicio';
    }
    if (inputImagen) {
        inputImagen.setAttribute('required', 'required');
    }
}

// Función para configurar el modal para editar ejercicio
function configurarModalBibliotecaEditar() {
    const modalTitulo = document.getElementById('modal-biblioteca-titulo');
    const inputImagen = document.getElementById('imagen-biblioteca');
    
    if (modalTitulo) {
        modalTitulo.textContent = 'Editar Ejercicio';
    }
    if (inputImagen) {
        inputImagen.removeAttribute('required');
    }
}

// Función para manejar el submit del formulario de categoría
async function manejarSubmitCategoria(e) {
    e.preventDefault();
    
    const boton = e.target.querySelector('button[type="submit"]');
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // 2. Obtener valor del formulario
        const nombreInput = document.getElementById('nombre-categoria');
        const nombre = nombreInput ? nombreInput.value.trim() : '';
        
        if (!nombre) {
            throw new Error('El nombre es requerido');
        }
        
        // 3. Agregar o editar la categoría
        if (currentlyEditingCategoriaId) {
            // Estamos editando
            await editarCategoria(currentlyEditingCategoriaId, nombre);
            console.log('Categoría actualizada:', currentlyEditingCategoriaId);
        } else {
            // Es nueva
            await agregarCategoria(nombre);
            console.log('Categoría agregada:', nombre);
        }
        
        // 4. Recargar la lista de categorías
        const categorias = await obtenerCategorias();
        renderizarListaCategorias(categorias, editarCategoriaHandler, eliminarCategoriaHandler, mostrarVistaCategoriaEjercicios);
        
        // 5. Resetear el ID de edición
        currentlyEditingCategoriaId = null;
        
        // 6. Cerrar el modal
        ocultarModalCategoria();
        
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        alert('Error al guardar la categoría. Por favor, intenta de nuevo.');
    } finally {
        // 7. Quitar estado de carga
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para editar una categoría (maneja la UI)
async function editarCategoriaHandler(categoriaId) {
    try {
        const categorias = await obtenerCategorias();
        const categoria = categorias.find(c => c.id === categoriaId);
        
        if (!categoria) {
            console.error('Categoría no encontrada');
            return;
        }
        
        // Guardar el ID de la categoría que estamos editando
        currentlyEditingCategoriaId = categoriaId;
        
        // Poblar el formulario
        const nombreInput = document.getElementById('nombre-categoria');
        if (nombreInput) {
            nombreInput.value = categoria.nombre;
        }
        
        // Cambiar el título del modal
        const modalTitulo = document.querySelector('#modal-nueva-categoria h3');
        if (modalTitulo) {
            modalTitulo.textContent = 'Editar Categoría';
        }
        
        // Mostrar el modal
        mostrarModalCategoria();
        
    } catch (error) {
        console.error('Error al cargar categoría para editar:', error);
    }
}

// Función para eliminar una categoría
async function eliminarCategoriaHandler(categoriaId, botonElement) {
    const confirmado = await showConfirmationModal(
        'Eliminar Categoría',
        '¿Estás seguro de que quieres eliminar esta categoría?'
    );
    
    if (!confirmado) {
        return;
    }
    
    // 1. Mostrar estado de carga
    if (botonElement) {
        botonElement.classList.add('is-loading');
    }
    
    try {
        // 2. Hacer el trabajo
        await eliminarCategoria(categoriaId);
        const categorias = await obtenerCategorias();
        renderizarListaCategorias(categorias, editarCategoriaHandler, eliminarCategoriaHandler, mostrarVistaCategoriaEjercicios);
        console.log('Categoría eliminada:', categoriaId);
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al eliminar la categoría:', error);
        alert('Error al eliminar la categoría. Por favor, intenta de nuevo.');
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (botonElement) {
            botonElement.classList.remove('is-loading');
        }
    }
}

// Función para mostrar la vista de ejercicios de categoría
async function mostrarVistaCategoriaEjercicios(categoriaId, categoriaNombre) {
    categoriaActual = { id: categoriaId, nombre: categoriaNombre };
    
    // 1. CAMBIA DE VISTA INMEDIATAMENTE (UI Optimista)
    renderizarCategoriaEjerciciosView(categoriaNombre); // Pinta el "esqueleto" con el spinner
    showView(getCategoriaEjerciciosView());
    configurarEventListenersCategoriaEjercicios(); // Configura el "Añadir", etc.
    
    // Actualizar breadcrumbs
    actualizarBreadcrumbs([
        { texto: 'Categorías', vista: 'biblioteca-view' },
        { texto: categoriaNombre }
    ], manejarNavegacionBreadcrumbs);
    
    // 2. AHORA, busca los datos en segundo plano
    try {
        const ejercicios = await obtenerEjerciciosDeCategoria(categoriaId);
        
        // 3. Cuando lleguen, reemplaza el spinner
        renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
        
        // 4. Configurar drag and drop
        configurarDragAndDropEjerciciosCategoria();
        
    } catch (error) {
        // Si falla, reemplaza el spinner con un error
        const listaContainer = document.getElementById('lista-ejercicios-categoria-container');
        if (listaContainer) {
            listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error al cargar ejercicios de la categoría.</p>';
        }
        console.error('Error al cargar ejercicios de la categoría:', error);
    }
}

// Función para configurar los event listeners de la vista de ejercicios de categoría
function configurarEventListenersCategoriaEjercicios() {
    const btnAnadir = document.getElementById('btn-anadir-ejercicio-categoria');
    const btnCancelar = document.getElementById('btn-cancelar-ejercicio-categoria');
    const formEjercicio = document.getElementById('form-nuevo-ejercicio-categoria');
    const modalEjercicio = document.getElementById('modal-nuevo-ejercicio-categoria');
    
    // Botón "Añadir Ejercicio"
    if (btnAnadir) {
        btnAnadir.addEventListener('click', function() {
            mostrarModalEjercicioCategoria();
        });
    }
    
    // Botón "Cancelar"
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            ocultarModalEjercicioCategoria();
        });
    }
    
    // Formulario
    if (formEjercicio) {
        formEjercicio.addEventListener('submit', manejarSubmitEjercicioCategoria);
    }
    
    // Cerrar modal al hacer clic fuera
    if (modalEjercicio) {
        modalEjercicio.addEventListener('click', function(e) {
            if (e.target === modalEjercicio) {
                ocultarModalEjercicioCategoria();
            }
        });
    }
}

// Función para mostrar el modal de ejercicio de categoría
function mostrarModalEjercicioCategoria() {
    const modal = document.getElementById('modal-nuevo-ejercicio-categoria');
    if (modal) {
        modal.classList.add('active');
    }
    
    // Actualizar el título del modal según si se está editando o no
    const tituloModal = document.getElementById('modal-ejercicio-categoria-titulo');
    if (tituloModal) {
        tituloModal.textContent = currentlyEditingEjercicioCategoriaId ? 'Editar Ejercicio' : 'Nuevo Ejercicio';
    }
    
    // Hacer que la imagen no sea requerida si se está editando
    const imagenInput = document.getElementById('imagen-ejercicio-categoria');
    if (imagenInput) {
        imagenInput.required = !currentlyEditingEjercicioCategoriaId;
    }
}

// Función para ocultar el modal de ejercicio de categoría
function ocultarModalEjercicioCategoria() {
    const modal = document.getElementById('modal-nuevo-ejercicio-categoria');
    if (modal) {
        modal.classList.remove('active');
    }
    
    const form = document.getElementById('form-nuevo-ejercicio-categoria');
    if (form) {
        form.reset();
    }
    
    // Resetear el campo de imagen a requerido
    const imagenInput = document.getElementById('imagen-ejercicio-categoria');
    if (imagenInput) {
        imagenInput.required = true;
    }
    
    // Resetear el ID de edición
    currentlyEditingEjercicioCategoriaId = null;
}

// Función para manejar el submit del formulario de ejercicio de categoría
async function manejarSubmitEjercicioCategoria(e) {
    e.preventDefault();
    
    if (!categoriaActual) {
        console.error('No hay categoría actual');
        return;
    }
    
    const boton = e.target.querySelector('button[type="submit"]');
    
    // 1. Mostrar estado de carga
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // 2. Obtener valores del formulario
        const nombreInput = document.getElementById('nombre-ejercicio-categoria');
        const imagenInput = document.getElementById('imagen-ejercicio-categoria');
        
        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const archivoImagen = imagenInput && imagenInput.files.length > 0 ? imagenInput.files[0] : null;
        
        if (!nombre) {
            throw new Error('El nombre es requerido');
        }
        
        const ejercicioData = {
            nombre: nombre,
            archivoImagen: archivoImagen
        };
        
        // 3. Agregar o editar el ejercicio según corresponda
        if (currentlyEditingEjercicioCategoriaId) {
            // Editar ejercicio existente
            await editarEjercicioDeCategoria(categoriaActual.id, currentlyEditingEjercicioCategoriaId, ejercicioData);
            console.log('Ejercicio de categoría actualizado:', nombre);
        } else {
            // Agregar nuevo ejercicio
            await agregarEjercicioACategoria(categoriaActual.id, ejercicioData);
            console.log('Ejercicio agregado a la categoría:', nombre);
        }
        
        // 4. Recargar la lista de ejercicios
        const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
        renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
        
        // 5. Re-configurar drag and drop
        configurarDragAndDropEjerciciosCategoria();
        
        // 6. Cerrar el modal
        ocultarModalEjercicioCategoria();
        
        // 7. Resetear el ID de edición
        currentlyEditingEjercicioCategoriaId = null;
        
    } catch (error) {
        console.error('Error al guardar ejercicio de categoría:', error);
        alert('Error al guardar el ejercicio. Por favor, intenta de nuevo.');
    } finally {
        // 6. Quitar estado de carga
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para eliminar un ejercicio de categoría
async function eliminarEjercicioCategoriaHandler(ejercicioId, botonElement) {
    const confirmed = await showConfirmationModal('Eliminar Ejercicio', '¿Estás seguro de que quieres eliminar este ejercicio?');
    if (!confirmed) {
        return;
    }
    
    if (!categoriaActual) {
        console.error('No hay categoría actual');
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
        await eliminarEjercicioDeCategoria(categoriaActual.id, ejercicioId);
        const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
        renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
        
        // Re-configurar los event listeners (incluyendo drag and drop)
        configurarDragAndDropEjerciciosCategoria();
        console.log('Ejercicio de categoría eliminado:', ejercicioId);
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al eliminar el ejercicio de categoría:', error);
        alert('Error al eliminar el ejercicio. Por favor, intenta de nuevo.');
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para editar un ejercicio de categoría
async function editarEjercicioCategoriaHandler(ejercicioId) {
    if (!categoriaActual) {
        console.error('No hay categoría actual');
        return;
    }
    
    const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
    const ejercicio = ejercicios.find(e => e.id === ejercicioId);
    
    if (!ejercicio) {
        console.error('Ejercicio no encontrado');
        return;
    }
    
    // Guardar el ID del ejercicio que se está editando
    currentlyEditingEjercicioCategoriaId = ejercicioId;
    
    // Poblar el formulario con los datos del ejercicio
    const nombreInput = document.getElementById('nombre-ejercicio-categoria');
    if (nombreInput) {
        nombreInput.value = ejercicio.nombre;
    }
    
    // Mostrar el modal
    mostrarModalEjercicioCategoria();
}

// Función para configurar drag and drop para ejercicios de categoría
function configurarDragAndDropEjerciciosCategoria() {
    const listaEjercicios = document.getElementById('lista-ejercicios-categoria-container');
    if (!listaEjercicios) {
        return;
    }
    
    if (!categoriaActual) {
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
                draggedId = draggedElement.dataset.ejercicioId;
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
        e.stopPropagation();
        
        if (!draggedId || !categoriaActual || !draggedElement) {
            return;
        }
        
        // Encontrar el elemento sobre el que se soltó
        const targetCard = e.target.closest('.ejercicio-card');
        if (!targetCard) {
            return;
        }
        
        const targetId = targetCard.dataset.ejercicioId;
        
        // Si es el mismo elemento, no hacer nada
        if (targetId === draggedId) {
            return;
        }
        
        // Reordenar en storage
        try {
            await reordenarEjerciciosDeCategoria(categoriaActual.id, draggedId, targetId);
            
            // Obtener los ejercicios actualizados
            const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
            
            // Re-renderizar la lista de ejercicios (esto limpiará el contenedor y volverá a renderizar)
            renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
            
            // Re-configurar los event listeners (incluyendo drag and drop)
            configurarDragAndDropEjerciciosCategoria();
            
            console.log('Ejercicios de categoría reordenados');
        } catch (error) {
            console.error('Error al reordenar ejercicios de categoría:', error);
            // En caso de error, también re-renderizar para restaurar el estado
            const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
            renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
            configurarDragAndDropEjerciciosCategoria();
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
            draggedId = draggedElement.dataset.ejercicioId;
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
            listaEjercicios.appendChild(dragging);
        } else {
            if (afterElement && afterElement.parentNode) {
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
        
        if (!targetCard || !categoriaActual) {
            // Resetear estado
            draggedElement.classList.remove('dragging');
            draggedElement = null;
            draggedId = null;
            touchStartY = null;
            touchOffsetY = null;
            initialY = null;
            return;
        }
        
        const targetId = targetCard.dataset.ejercicioId;
        
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
            await reordenarEjerciciosDeCategoria(categoriaActual.id, draggedId, targetId);
            
            // Re-renderizar la lista de ejercicios
            const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
            renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
            
            // Re-configurar los event listeners (incluyendo drag and drop)
            configurarDragAndDropEjerciciosCategoria();
            
            console.log('Ejercicios de categoría reordenados');
        } catch (error) {
            console.error('Error al reordenar ejercicios de categoría:', error);
        }
        
        // Resetear estado
        draggedElement.classList.remove('dragging');
        draggedElement = null;
        draggedId = null;
        touchStartY = null;
        touchOffsetY = null;
        initialY = null;
    }, { passive: false });
}

// Función para editar un ejercicio de la biblioteca (maneja la UI)
async function editarEjercicioBibliotecaHandler(ejercicioId) {
    try {
        const ejercicios = await obtenerEjerciciosBiblioteca();
        const ejercicio = ejercicios.find(e => e.id === ejercicioId);
        
        if (!ejercicio) {
            console.error('Ejercicio no encontrado');
            return;
        }
        
        // Guardar el ID del ejercicio que estamos editando
        currentlyEditingId = ejercicioId;
        
        // Poblar el formulario
        const nombreInput = document.getElementById('nombre-biblioteca');
        const etiquetaInput = document.getElementById('etiqueta-biblioteca');
        const imagenInput = document.getElementById('imagen-biblioteca');
        
        if (nombreInput) {
            nombreInput.value = ejercicio.nombre;
        }
        if (etiquetaInput) {
            etiquetaInput.value = ejercicio.etiqueta || '';
        }
        if (imagenInput) {
            imagenInput.removeAttribute('required');
            if (ejercicio.imagenUrl) {
                imagenInput.dataset.currentImage = ejercicio.imagenUrl;
            }
        }
        
        // Configurar el modal para editar
        configurarModalBibliotecaEditar();
        
        // Mostrar el modal
        mostrarModalBiblioteca();
        
    } catch (error) {
        console.error('Error al cargar ejercicio para editar:', error);
    }
}

// Función para eliminar un ejercicio de la biblioteca
async function eliminarEjercicioBibliotecaHandler(ejercicioId, botonElement) {
    const confirmado = await showConfirmationModal(
        'Eliminar Ejercicio',
        '¿Estás seguro de que quieres eliminar este ejercicio de la biblioteca?'
    );
    
    if (!confirmado) {
        return;
    }
    
    // 1. Mostrar estado de carga
    if (botonElement) {
        botonElement.classList.add('is-loading');
    }
    
    try {
        // 2. Hacer el trabajo
        await eliminarEjercicioBiblioteca(ejercicioId);
        const ejercicios = await obtenerEjerciciosBiblioteca();
        renderizarListaBiblioteca(ejercicios, editarEjercicioBibliotecaHandler, eliminarEjercicioBibliotecaHandler);
        console.log('Ejercicio de biblioteca eliminado:', ejercicioId);
    } catch (error) {
        // 3. Manejar el error
        console.error('Error al eliminar el ejercicio de la biblioteca:', error);
        alert('Error al eliminar el ejercicio. Por favor, intenta de nuevo.');
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (botonElement) {
            botonElement.classList.remove('is-loading');
        }
    }
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
    
    // Actualizar breadcrumbs
    actualizarBreadcrumbs([
        { texto: 'Entrenos', vista: 'dashboard-view' },
        { texto: entrenoActual.nombre, vista: 'entreno-view', action: 'mostrarEntreno', param: entrenoActual.id },
        { texto: ejercicio.nombre }
    ], manejarNavegacionBreadcrumbs);
    
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
        renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio);
        
        // Re-configurar los event listeners (incluyendo drag and drop)
        configurarDragAndDropEjercicios();
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

// Función para toggle del estado completado de un ejercicio
async function toggleCompletado(entrenoId, ejercicioId) {
    try {
        // Paso 1: Guardar en BD
        await toggleCompletadoEjercicio(entrenoId, ejercicioId);
        
        // Pequeño delay para asegurar que Firestore haya propagado el cambio
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Paso 2: Obtener la lista actualizada con los nuevos estados (CRÍTICO: traer datos frescos)
        const ejerciciosActualizados = await obtenerEjerciciosDeEntreno(entrenoId);
        
        // Verificar que los datos se obtuvieron correctamente
        if (!ejerciciosActualizados || ejerciciosActualizados.length === 0) {
            console.warn('No se pudieron obtener los ejercicios actualizados');
            return;
        }
        
        // Crear función que capture el entrenoId para el toggle (crucial volver a pasar el ID)
        const onToggle = (id) => toggleCompletado(entrenoId, id);
        
        // Paso 3: Volver a pintar todo para que los items se muevan a sus secciones correctas
        renderizarListaEjercicios(ejerciciosActualizados, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
        
        // Paso 4: Re-configurar drag and drop
        configurarDragAndDropEjercicios();
        
        // Paso 5: Actualizar barra de progreso si existe
        if (typeof actualizarBarraProgreso === 'function') {
            actualizarBarraProgreso();
        }
    } catch (error) {
        console.error('Error al toggle completado:', error);
    }
}

// Función para sustituir un ejercicio
async function sustituirEjercicio(ejercicioId) {
    const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
    const ejercicio = ejercicios.find(e => e.id === ejercicioId);
    
    if (!ejercicio) {
        console.error('Ejercicio no encontrado');
        return;
    }
    
    // Guardar el ejercicio que se está sustituyendo
    ejercicioSustituyendo = ejercicio;
    
    // Paso 1: Mostrar modal inmediatamente con spinner
    renderizarModalSeleccionEjercicio(null);
    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
    if (modalSeleccion) {
        modalSeleccion.style.display = 'flex';
    }
    
    // Configurar listener básico para cerrar el modal
    const btnCerrar = document.getElementById('btn-cerrar-seleccion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', function() {
            modalSeleccion.style.display = 'none';
            ejercicioSustituyendo = null;
        });
    }
    
    // Paso 2: Cargar datos en segundo plano
    try {
        let ejerciciosPorCategoria;
        if (ejercicio.categoriaId) {
            // Obtener todos los ejercicios y filtrar solo la categoría del ejercicio actual
            const todosLosEjercicios = await obtenerTodosLosEjerciciosDeBiblioteca();
            ejerciciosPorCategoria = todosLosEjercicios.filter(item => item.categoria.id === ejercicio.categoriaId);
            
            // Si no hay ejercicios en esa categoría, mostrar todos
            if (ejerciciosPorCategoria.length === 0) {
                ejerciciosPorCategoria = todosLosEjercicios;
            }
        } else {
            // Si no tiene categoriaId, mostrar todos los ejercicios
            ejerciciosPorCategoria = await obtenerTodosLosEjerciciosDeBiblioteca();
        }
        
        // Paso 3: Actualizar modal con los datos reales
        renderizarModalSeleccionEjercicio(ejerciciosPorCategoria);
        
        // Si hay una categoría específica, abrirla automáticamente
        if (ejercicio.categoriaId && ejerciciosPorCategoria.length > 0) {
            setTimeout(() => {
                const categoriaIndex = ejerciciosPorCategoria.findIndex(item => item.categoria.id === ejercicio.categoriaId);
                if (categoriaIndex >= 0) {
                    const ejerciciosContainer = document.getElementById(`ejercicios-categoria-${categoriaIndex}`);
                    const header = document.querySelector(`[data-categoria-index="${categoriaIndex}"]`);
                    if (ejerciciosContainer && header) {
                        ejerciciosContainer.classList.add('active');
                        ejerciciosContainer.style.display = 'block';
                        header.classList.add('active');
                    }
                }
            }, 100);
        }
        
        // Configurar listeners del modal de selección para sustitución
        configurarEventListenersModalSeleccionSustitucion(ejercicioId);
    } catch (error) {
        console.error('Error al cargar ejercicios de la biblioteca:', error);
        // Mostrar error en el modal
        const modalContent = modalSeleccion?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <h3>SELECCIONAR EJERCICIO</h3>
                <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    Error al cargar los ejercicios de la biblioteca.
                </p>
                <div class="modal-buttons">
                    <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                </div>
            `;
            const btnCerrarError = document.getElementById('btn-cerrar-seleccion');
            if (btnCerrarError) {
                btnCerrarError.addEventListener('click', function() {
                    modalSeleccion.style.display = 'none';
                    ejercicioSustituyendo = null;
                });
            }
        }
    }
}

// Función para configurar los event listeners del modal de selección para sustitución
function configurarEventListenersModalSeleccionSustitucion(ejercicioIdOriginal) {
    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
    if (!modalSeleccion) return;
    
    // Cerrar modal al hacer clic en cancelar
    const btnCerrar = document.getElementById('btn-cerrar-seleccion');
    if (btnCerrar) {
        const newBtnCerrar = btnCerrar.cloneNode(true);
        btnCerrar.parentNode.replaceChild(newBtnCerrar, btnCerrar);
        
        newBtnCerrar.addEventListener('click', function() {
            modalSeleccion.style.display = 'none';
            ejercicioSustituyendo = null;
        });
    }
    
    // Cerrar modal al hacer clic fuera
    modalSeleccion.addEventListener('click', function(e) {
        if (e.target === modalSeleccion) {
            modalSeleccion.style.display = 'none';
            ejercicioSustituyendo = null;
        }
    });
    
    // Toggle de categorías (acordeón)
    const categoriaHeaders = modalSeleccion.querySelectorAll('.categoria-seleccion-header');
    categoriaHeaders.forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        
        newHeader.addEventListener('click', function() {
            const index = this.dataset.categoriaIndex;
            const ejerciciosContainer = document.getElementById(`ejercicios-categoria-${index}`);
            
            if (ejerciciosContainer) {
                const isVisible = ejerciciosContainer.classList.contains('active');
                
                if (isVisible) {
                    ejerciciosContainer.classList.remove('active');
                    ejerciciosContainer.style.display = 'none';
                    this.classList.remove('active');
                } else {
                    ejerciciosContainer.classList.add('active');
                    ejerciciosContainer.style.display = 'block';
                    this.classList.add('active');
                }
            }
        });
    });
    
    // Seleccionar ejercicio para sustituir
    const ejercicioItems = modalSeleccion.querySelectorAll('.ejercicio-seleccion-item');
    ejercicioItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', async function(e) {
            const tarjeta = e.currentTarget;
            const bibliotecaId = this.dataset.ejercicioId;
            const categoriaId = this.dataset.categoriaId;
            
            // Añadir clase de carga inmediatamente
            tarjeta.classList.add('is-loading');
            
            try {
                // Verificar que no se esté intentando sustituir por el mismo ejercicio
                const ejerciciosActuales = await obtenerEjerciciosDeEntreno(entrenoActual.id);
                const ejercicioOriginal = ejerciciosActuales.find(ej => ej.id === ejercicioIdOriginal);
                
                if (ejercicioOriginal && ejercicioOriginal.bibliotecaId === bibliotecaId) {
                    tarjeta.classList.remove('is-loading');
                    // Cerrar el modal de selección antes de mostrar el modal de información
                    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
                    if (modalSeleccion) {
                        modalSeleccion.style.display = 'none';
                    }
                    await showInfoModal('Duplicado', 'Este ejercicio ya está seleccionado.');
                    return;
                }
                
                // Verificar que el nuevo ejercicio no esté ya en el entreno (en otra posición)
                const ejercicioDuplicado = ejerciciosActuales.find(ej => ej.bibliotecaId === bibliotecaId && ej.id !== ejercicioIdOriginal);
                if (ejercicioDuplicado) {
                    tarjeta.classList.remove('is-loading');
                    // Cerrar el modal de selección antes de mostrar el modal de información
                    const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
                    if (modalSeleccion) {
                        modalSeleccion.style.display = 'none';
                    }
                    await showInfoModal('Duplicado', 'Este ejercicio ya está en tu entreno.');
                    return;
                }
                
                // Sustituir el ejercicio
                await sustituirEjercicioEnEntreno(entrenoActual.id, ejercicioIdOriginal, bibliotecaId, categoriaId);
                
                // Cerrar modal
                modalSeleccion.style.display = 'none';
                ejercicioSustituyendo = null;
                
                // Refrescar la lista de ejercicios
                const ejerciciosActualizados = await obtenerEjerciciosDeEntreno(entrenoActual.id);
                const onToggle = (id) => toggleCompletado(entrenoActual.id, id);
                renderizarListaEjercicios(ejerciciosActualizados, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
                
                // Re-configurar drag and drop
                configurarDragAndDropEjercicios();
                
                console.log('Ejercicio sustituido desde la biblioteca');
            } catch (error) {
                console.error('Error al sustituir ejercicio:', error);
                tarjeta.classList.remove('is-loading');
                // Cerrar el modal de selección antes de mostrar el modal de información
                const modalSeleccion = document.getElementById('modal-seleccion-ejercicio');
                if (modalSeleccion) {
                    modalSeleccion.style.display = 'none';
                }
                await showInfoModal('Error', 'Error al sustituir el ejercicio');
            }
        });
    });
}

// Función para manejar la navegación desde los breadcrumbs
function manejarNavegacionBreadcrumbs(vista, action, param) {
    if (vista === 'dashboard-view') {
        showView(getDashboardView());
    } else if (vista === 'biblioteca-view') {
        mostrarVistaBiblioteca();
    } else if (vista === 'entreno-view') {
        if (action === 'mostrarEntreno' && entrenoActual) {
            mostrarVistaEntreno(entrenoActual);
        } else if (entrenoActual) {
            mostrarVistaEntreno(entrenoActual);
        } else {
            showView(getDashboardView());
        }
    }
}

// Función para inicializar la aplicación
async function initApp() {
    try {
        // Cargar entrenos desde Firestore
        const entrenos = await cargarEntrenos() || [];
        
        // Renderizar la vista completa del dashboard
        renderizarDashboardView(entrenos, mostrarVistaEntreno, mostrarVistaBiblioteca);
        
        // Asegurar que solo el dashboard esté visible al cargar
        showView(getDashboardView());
        
        // Configurar botón "Volver" del header principal
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', function() {
                // Si estamos en la vista de ejercicios de categoría, volver a biblioteca
                const categoriaEjerciciosView = getCategoriaEjerciciosView();
                if (categoriaEjerciciosView && categoriaEjerciciosView.classList.contains('active')) {
                    mostrarVistaBiblioteca();
                    return;
                }
                // Si estamos en la vista de biblioteca, volver al dashboard
                const bibliotecaView = getBibliotecaView();
                if (bibliotecaView && bibliotecaView.classList.contains('active')) {
                    showView(getDashboardView());
                    return;
                }
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
        
        // Configurar listeners de clic para los tabs (Floating Tab Bar)
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(tab => {
            tab.addEventListener('click', function() {
                const viewId = this.dataset.view;
                
                if (viewId === 'dashboard-view') {
                    showView(getDashboardView());
                } else if (viewId === 'biblioteca-view') {
                    mostrarVistaBiblioteca();
                } else if (viewId === 'perfil-view') {
                    mostrarVistaPerfil();
                }
            });
        });
        
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

