// ui.js - Lógica de manipulación del DOM

// Referencias a elementos del DOM (se actualizarán después de renderizar)
let dashboardView = null;
let entrenoView = null;
let ejercicioView = null;
let dashboardContainer = null;
let listaEjercicios = null;
let entrenoTitulo = null;
let modalNuevoEjercicio = null;
let formNuevoEjercicio = null;
let inputNombreEjercicio = null;
let inputImagenEjercicio = null;

// Función para actualizar referencias a elementos del DOM
function actualizarReferenciasDOM() {
    dashboardView = document.getElementById('dashboard-view');
    entrenoView = document.getElementById('entreno-view');
    ejercicioView = document.getElementById('ejercicio-view');
    dashboardContainer = document.querySelector('.dashboard-container');
    listaEjercicios = document.getElementById('lista-ejercicios');
    entrenoTitulo = document.getElementById('entreno-titulo');
    modalNuevoEjercicio = document.getElementById('modal-nuevo-ejercicio');
    formNuevoEjercicio = document.getElementById('form-nuevo-ejercicio');
    inputNombreEjercicio = document.getElementById('nombre-ejercicio');
    inputImagenEjercicio = document.getElementById('imagen-ejercicio');
}

// Función para mostrar una vista específica y ocultar las demás
export function showView(viewToShow) {
    actualizarReferenciasDOM();
    
    // Ocultar todas las vistas
    if (dashboardView) dashboardView.classList.remove('active');
    if (entrenoView) entrenoView.classList.remove('active');
    if (ejercicioView) ejercicioView.classList.remove('active');
    
    // Mostrar la vista solicitada
    if (viewToShow) {
        viewToShow.classList.add('active');
    }
    
    // Mostrar/ocultar botón "Volver" según la vista activa
    const backButton = document.getElementById('back-button');
    if (backButton) {
        // Obtener el ID de la vista activa para comparar
        const viewId = viewToShow ? viewToShow.id : null;
        if (viewId === 'dashboard-view') {
            backButton.style.display = 'none';
        } else {
            backButton.style.display = 'block';
        }
    }
}

// Función para renderizar la vista completa del dashboard
export function renderizarDashboardView(entrenos, onEntrenoClick) {
    actualizarReferenciasDOM();
    
    const dashboardHTML = `
        <h1>Entrenos</h1>
        <div class="dashboard-container">
            ${entrenos.map(entreno => `
                <div class="entreno-card" data-entreno-id="${entreno.id}">
                    <img src="${entreno.imagen}" alt="${entreno.descripcion}" class="entreno-card-image">
                    <div class="entreno-card-content">
                        <h2 class="entreno-card-title">${entreno.nombre}</h2>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    dashboardView.innerHTML = dashboardHTML;
    
    // Agregar event listeners a las tarjetas
    const cards = dashboardView.querySelectorAll('.entreno-card');
    cards.forEach(card => {
        const entrenoId = parseInt(card.dataset.entrenoId);
        const entreno = entrenos.find(e => e.id === entrenoId);
        if (entreno) {
            card.addEventListener('click', () => onEntrenoClick(entreno));
        }
    });
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar las tarjetas de entreno en el dashboard (mantener compatibilidad)
export function renderizarEntrenos(entrenos, onEntrenoClick) {
    renderizarDashboardView(entrenos, onEntrenoClick);
}

// Función para renderizar la vista completa de entreno
export function renderizarEntrenoView(entreno, ejercicios, onEditarClick, onEliminarClick, onEjercicioClick) {
    actualizarReferenciasDOM();
    
    const ejerciciosHTML = ejercicios.length === 0
        ? '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios agregados aún</p>'
        : ejercicios.map(ejercicio => `
            <div class="ejercicio-card" data-ejercicio-id="${ejercicio.id}" style="cursor: pointer;">
                <div class="drag-handle" draggable="true">⠿</div>
                <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-card-image">
                <div class="ejercicio-card-content">
                    <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
                </div>
                <div class="ejercicio-card-actions">
                    <button class="btn-editar" data-ejercicio-id="${ejercicio.id}" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-eliminar" data-ejercicio-id="${ejercicio.id}" title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    
    const entrenoHTML = `
        <h2 id="entreno-titulo">${entreno.nombre}</h2>
        <div id="lista-ejercicios" class="lista-ejercicios">
            ${ejerciciosHTML}
        </div>
        <button id="btn-anadir-ejercicio" class="btn btn-anadir">Añadir Ejercicio</button>
        
        <!-- Modal para nuevo ejercicio -->
        <div id="modal-nuevo-ejercicio" class="modal">
            <div class="modal-content">
                <h3>Nuevo Ejercicio</h3>
                <form id="form-nuevo-ejercicio">
                    <div class="form-group">
                        <label for="nombre-ejercicio">Nombre del ejercicio</label>
                        <input type="text" id="nombre-ejercicio" name="nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="imagen-ejercicio">Subir imagen</label>
                        <input type="file" id="imagen-ejercicio" name="imagen" accept="image/*" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-ejercicio" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    entrenoView.innerHTML = entrenoHTML;
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
    
    // Agregar event listeners a las tarjetas y botones de ejercicios
    if (ejercicios.length > 0) {
        // Event listeners para hacer clic en las tarjetas (navegar a vista de ejercicio)
        if (onEjercicioClick) {
            const cards = entrenoView.querySelectorAll('.ejercicio-card');
            cards.forEach(card => {
                card.addEventListener('click', function(e) {
                    // No navegar si se hace clic en los botones, el drag handle o si se está arrastrando
                    if (!e.target.closest('.ejercicio-card-actions') && 
                        !e.target.closest('.drag-handle') && 
                        !card.classList.contains('dragging')) {
                        const ejercicioId = parseInt(card.dataset.ejercicioId);
                        onEjercicioClick(ejercicioId);
                    }
                });
            });
        }
        
        const botonesEliminar = entrenoView.querySelectorAll('.btn-eliminar');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const ejercicioId = parseInt(this.dataset.ejercicioId);
                onEliminarClick(ejercicioId, this); // Pasar el botón como segundo parámetro
            });
        });
        
        const botonesEditar = entrenoView.querySelectorAll('.btn-editar');
        botonesEditar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const ejercicioId = parseInt(this.dataset.ejercicioId);
                onEditarClick(ejercicioId);
            });
        });
    }
}

// Función para renderizar la vista completa de ejercicio (registro de progreso)
export function renderizarEjercicioView(ejercicio, registros, onEditarRegistroClick, onEliminarRegistroClick) {
    actualizarReferenciasDOM();
    
    // Obtener fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0];
    
    // Función auxiliar para formatear una serie
    const formatearSerie = (serie) => {
        if (serie && serie.peso && serie.repeticiones) {
            return `${serie.peso}kg x ${serie.repeticiones}`;
        }
        return '-';
    };
    
    // Generar HTML de la tabla de registros
    const registrosHTML = registros && registros.length > 0
        ? `
            <div class="registros-table-container">
                <table class="registros-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Serie 1</th>
                            <th>Serie 2</th>
                            <th>Serie 3</th>
                            <th>Serie 4</th>
                            <th>Notas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registros.map(registro => {
                            const series = registro.series || [];
                            return `
                                <tr>
                                    <td>${new Date(registro.fecha).toLocaleDateString('es-ES')}</td>
                                    <td class="serie-cell">${formatearSerie(series[0])}</td>
                                    <td class="serie-cell">${formatearSerie(series[1])}</td>
                                    <td class="serie-cell">${formatearSerie(series[2])}</td>
                                    <td class="serie-cell">${formatearSerie(series[3])}</td>
                                    <td class="notas-cell">${registro.notas || '-'}</td>
                                    <td class="acciones-cell">
                                        <button class="btn-editar-registro" data-registro-id="${registro.id}" title="Editar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="btn-eliminar-registro" data-registro-id="${registro.id}" title="Eliminar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `
        : '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay registros aún</p>';
    
    const ejercicioHTML = `
        <h2 id="ejercicio-titulo">${ejercicio.nombre}</h2>
        <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-view-image">
        
        <div class="registros-section">
            <h3>Historial de Registros</h3>
            <div id="lista-registros" class="lista-registros">
                ${registrosHTML}
            </div>
        </div>
        
        <button id="btn-abrir-modal-registro" class="btn btn-anadir">Añadir Registro</button>
        
        <!-- Modal para nuevo registro -->
        <div id="modal-nuevo-registro" class="modal">
            <div class="modal-content">
                <h3>Nuevo Registro</h3>
                <form id="form-nuevo-registro" class="form-registro">
                    <div class="form-group">
                        <label for="fecha-registro">Fecha</label>
                        <input type="date" id="fecha-registro" name="fecha" value="${hoy}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Series</label>
                        <div class="series-container">
                            ${[1, 2, 3, 4].map(num => `
                                <div class="serie-input">
                                    <label>Serie ${num}</label>
                                    <div class="serie-inputs">
                                        <input type="number" id="peso-serie-${num}" name="peso-${num}" placeholder="Peso (kg)" min="0" step="0.5">
                                        <span>x</span>
                                        <input type="number" id="rep-serie-${num}" name="rep-${num}" placeholder="Reps" min="0">
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notas-registro">Notas</label>
                        <textarea id="notas-registro" name="notas" rows="3" placeholder="Notas adicionales..."></textarea>
                    </div>
                    
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-registro" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar Registro</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    ejercicioView.innerHTML = ejercicioHTML;
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
    
    // Agregar event listeners a los botones de editar y eliminar registro
    if (registros && registros.length > 0) {
        const botonesEditarRegistro = ejercicioView.querySelectorAll('.btn-editar-registro');
        botonesEditarRegistro.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const registroId = parseInt(this.dataset.registroId);
                if (onEditarRegistroClick) {
                    onEditarRegistroClick(registroId);
                }
            });
        });
        
        const botonesEliminarRegistro = ejercicioView.querySelectorAll('.btn-eliminar-registro');
        botonesEliminarRegistro.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const registroId = parseInt(this.dataset.registroId);
                if (onEliminarRegistroClick) {
                    onEliminarRegistroClick(registroId, this); // Pasar el botón como segundo parámetro
                }
            });
        });
    }
}

// Función para renderizar solo la lista de registros (actualizar después de agregar)
export function renderizarListaRegistros(registros, onEditarRegistroClick, onEliminarRegistroClick) {
    actualizarReferenciasDOM();
    
    const listaRegistros = document.getElementById('lista-registros');
    if (!listaRegistros) {
        console.error('lista-registros no encontrado');
        return;
    }
    
    // Función auxiliar para formatear una serie
    const formatearSerie = (serie) => {
        if (serie && serie.peso && serie.repeticiones) {
            return `${serie.peso}kg x ${serie.repeticiones}`;
        }
        return '-';
    };
    
    const registrosHTML = registros && registros.length > 0
        ? `
            <div class="registros-table-container">
                <table class="registros-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Serie 1</th>
                            <th>Serie 2</th>
                            <th>Serie 3</th>
                            <th>Serie 4</th>
                            <th>Notas</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registros.map(registro => {
                            const series = registro.series || [];
                            return `
                                <tr>
                                    <td>${new Date(registro.fecha).toLocaleDateString('es-ES')}</td>
                                    <td class="serie-cell">${formatearSerie(series[0])}</td>
                                    <td class="serie-cell">${formatearSerie(series[1])}</td>
                                    <td class="serie-cell">${formatearSerie(series[2])}</td>
                                    <td class="serie-cell">${formatearSerie(series[3])}</td>
                                    <td class="notas-cell">${registro.notas || '-'}</td>
                                    <td class="acciones-cell">
                                        <button class="btn-editar-registro" data-registro-id="${registro.id}" title="Editar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="btn-eliminar-registro" data-registro-id="${registro.id}" title="Eliminar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `
        : '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay registros aún</p>';
    
    listaRegistros.innerHTML = registrosHTML;
    
    // Agregar event listeners a los botones de editar y eliminar registro
    if (registros && registros.length > 0) {
        const botonesEditarRegistro = listaRegistros.querySelectorAll('.btn-editar-registro');
        botonesEditarRegistro.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const registroId = parseInt(this.dataset.registroId);
                if (onEditarRegistroClick) {
                    onEditarRegistroClick(registroId);
                }
            });
        });
        
        const botonesEliminarRegistro = listaRegistros.querySelectorAll('.btn-eliminar-registro');
        botonesEliminarRegistro.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const registroId = parseInt(this.dataset.registroId);
                if (onEliminarRegistroClick) {
                    onEliminarRegistroClick(registroId, this); // Pasar el botón como segundo parámetro
                }
            });
        });
    }
}

// Función para renderizar los ejercicios en la lista (actualiza solo la lista)
export function renderizarEjercicios(ejercicios, onEditarClick, onEliminarClick, onEjercicioClick) {
    actualizarReferenciasDOM();
    
    if (!listaEjercicios) {
        console.error('listaEjercicios no encontrado');
        return;
    }
    
    listaEjercicios.innerHTML = '';
    
    if (ejercicios.length === 0) {
        listaEjercicios.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios agregados aún</p>';
        return;
    }
    
    ejercicios.forEach((ejercicio, index) => {
        const card = document.createElement('div');
        card.className = 'ejercicio-card';
        card.style.cursor = 'pointer';
        card.dataset.ejercicioId = ejercicio.id;
        
        card.innerHTML = `
            <div class="drag-handle" draggable="true">⠿</div>
            <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-card-image">
            <div class="ejercicio-card-content">
                <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
            </div>
            <div class="ejercicio-card-actions">
                <button class="btn-editar" data-ejercicio-id="${ejercicio.id}" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-eliminar" data-ejercicio-id="${ejercicio.id}" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Agregar event listener para hacer clic en la tarjeta (navegar a vista de ejercicio)
        if (onEjercicioClick) {
            card.addEventListener('click', function(e) {
                // No navegar si se hace clic en los botones, el drag handle o si se está arrastrando
                if (!e.target.closest('.ejercicio-card-actions') && 
                    !e.target.closest('.drag-handle') && 
                    !card.classList.contains('dragging')) {
                    onEjercicioClick(ejercicio.id);
                }
            });
        }
        
        listaEjercicios.appendChild(card);
    });
    
    // Agregar event listeners a los botones
    const botonesEliminar = listaEjercicios.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const ejercicioId = parseInt(this.dataset.ejercicioId);
            onEliminarClick(ejercicioId, this); // Pasar el botón como segundo parámetro
        });
    });
    
    const botonesEditar = listaEjercicios.querySelectorAll('.btn-editar');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const ejercicioId = parseInt(this.dataset.ejercicioId);
            onEditarClick(ejercicioId);
        });
    });
}

// Función para mostrar el modal
export function mostrarModal() {
    actualizarReferenciasDOM();
    if (modalNuevoEjercicio) {
        modalNuevoEjercicio.classList.add('active');
    }
}

// Función para ocultar el modal
export function ocultarModal() {
    actualizarReferenciasDOM();
    if (modalNuevoEjercicio) {
        modalNuevoEjercicio.classList.remove('active');
    }
    if (formNuevoEjercicio) {
        formNuevoEjercicio.reset();
    }
    
    if (inputImagenEjercicio) {
        // Restaurar el atributo required del input de imagen (por defecto es obligatorio)
        inputImagenEjercicio.setAttribute('required', 'required');
        
        // Limpiar el atributo data de la imagen actual
        if (inputImagenEjercicio.dataset.currentImage) {
            delete inputImagenEjercicio.dataset.currentImage;
        }
    }
}

// Función para mostrar el modal de registro
export function mostrarModalRegistro() {
    const modalRegistro = document.getElementById('modal-nuevo-registro');
    if (modalRegistro) {
        modalRegistro.classList.add('active');
    }
}

// Función para ocultar el modal de registro
export function ocultarModalRegistro() {
    const modalRegistro = document.getElementById('modal-nuevo-registro');
    if (modalRegistro) {
        modalRegistro.classList.remove('active');
    }
    
    const formRegistro = document.getElementById('form-nuevo-registro');
    if (formRegistro) {
        formRegistro.reset();
        // Restaurar fecha a hoy
        const fechaInput = formRegistro.querySelector('#fecha-registro');
        if (fechaInput) {
            const hoy = new Date().toISOString().split('T')[0];
            fechaInput.value = hoy;
        }
        
        // Restaurar el texto del botón a "Guardar Registro"
        const btnSubmit = formRegistro.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = 'Guardar Registro';
        }
    }
}

// Función para mostrar modal de confirmación
export function showConfirmationModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const btnYes = document.getElementById('modal-btn-yes');
        const btnNo = document.getElementById('modal-btn-no');
        
        if (!modal || !modalTitle || !modalMessage || !btnYes || !btnNo) {
            console.error('Elementos del modal de confirmación no encontrados');
            resolve(false);
            return;
        }
        
        // Establecer título y mensaje
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Mostrar el modal
        modal.style.display = 'flex';
        
        // Función para cerrar el modal
        const closeModal = (result) => {
            modal.style.display = 'none';
            // Remover listeners para evitar memory leaks
            btnYes.removeEventListener('click', handleYes);
            btnNo.removeEventListener('click', handleNo);
            resolve(result);
        };
        
        // Handler para "Sí"
        const handleYes = () => {
            closeModal(true);
        };
        
        // Handler para "No"
        const handleNo = () => {
            closeModal(false);
        };
        
        // Añadir listeners
        btnYes.addEventListener('click', handleYes);
        btnNo.addEventListener('click', handleNo);
    });
}

// Función para poblar el formulario con datos de un ejercicio
export function poblarFormularioEjercicio(ejercicio) {
    actualizarReferenciasDOM();
    if (inputNombreEjercicio) {
        inputNombreEjercicio.value = ejercicio.nombre;
    }
    
    if (inputImagenEjercicio) {
        // Remover el atributo required del input de imagen (no es obligatorio al editar)
        inputImagenEjercicio.removeAttribute('required');
        
        // Guardar la imagen Base64 actual en un atributo data del input para referencia
        inputImagenEjercicio.dataset.currentImage = ejercicio.imagenUrl || ejercicio.imagenBase64;
    }
}

// Función para actualizar el título del modal
export function actualizarTituloModal(titulo) {
    const modalTitle = document.querySelector('.modal-content h3');
    modalTitle.textContent = titulo;
}

// Función para actualizar el título del entreno
export function actualizarTituloEntreno(nombre) {
    actualizarReferenciasDOM();
    if (entrenoTitulo) {
        entrenoTitulo.textContent = nombre;
    }
}

// Función para obtener valores del formulario
export function obtenerValoresFormulario() {
    actualizarReferenciasDOM();
    return {
        nombre: inputNombreEjercicio ? inputNombreEjercicio.value.trim() : '',
        archivoImagen: inputImagenEjercicio ? inputImagenEjercicio.files[0] : null
    };
}

// Función para configurar el modal para nuevo ejercicio
export function configurarModalNuevoEjercicio() {
    actualizarReferenciasDOM();
    if (inputImagenEjercicio) {
        inputImagenEjercicio.setAttribute('required', 'required');
    }
    actualizarTituloModal('Nuevo Ejercicio');
}

// Función para configurar el modal para editar ejercicio
export function configurarModalEditarEjercicio() {
    actualizarReferenciasDOM();
    if (inputImagenEjercicio) {
        inputImagenEjercicio.removeAttribute('required');
    }
    actualizarTituloModal('Editar Ejercicio');
}

// Exportar referencias a elementos del DOM que main.js necesita
export function getDashboardView() {
    actualizarReferenciasDOM();
    return dashboardView;
}

export function getEntrenoView() {
    actualizarReferenciasDOM();
    return entrenoView;
}

export function getModalNuevoEjercicio() {
    actualizarReferenciasDOM();
    return modalNuevoEjercicio;
}

export function getFormNuevoEjercicio() {
    actualizarReferenciasDOM();
    return formNuevoEjercicio;
}

// Función para obtener referencias a botones de la vista de entreno
export function getBtnAnadirEjercicio() {
    actualizarReferenciasDOM();
    return document.getElementById('btn-anadir-ejercicio');
}

export function getEjercicioView() {
    actualizarReferenciasDOM();
    return ejercicioView;
}

export function getFormNuevoRegistro() {
    actualizarReferenciasDOM();
    return document.getElementById('form-nuevo-registro');
}

