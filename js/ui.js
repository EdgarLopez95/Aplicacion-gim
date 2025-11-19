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

// Función auxiliar para obtener una imagen segura con fallback
function obtenerImagenSegura(imagenUrl) {
    if (!imagenUrl || imagenUrl.trim() === '') {
        return './images/favicon.png';
    }
    return imagenUrl;
}

// Función para actualizar referencias a elementos del DOM
function actualizarReferenciasDOM() {
    dashboardView = document.getElementById('dashboard-view');
    entrenoView = document.getElementById('entreno-view');
    ejercicioView = document.getElementById('ejercicio-view');
    dashboardContainer = document.querySelector('.dashboard-container');
    // Usar lista-ejercicios-container si existe, sino lista-ejercicios (para compatibilidad)
    listaEjercicios = document.getElementById('lista-ejercicios-container') || document.getElementById('lista-ejercicios');
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
    const bibliotecaView = document.getElementById('biblioteca-view');
    if (bibliotecaView) bibliotecaView.classList.remove('active');
    const categoriaEjerciciosView = document.getElementById('categoria-ejercicios-view');
    if (categoriaEjerciciosView) categoriaEjerciciosView.classList.remove('active');
    const perfilView = document.getElementById('perfil-view');
    if (perfilView) perfilView.classList.remove('active');
    
    // Mostrar la vista solicitada
    if (viewToShow) {
        viewToShow.classList.add('active');
    }
    
    // Obtener el ID de la vista activa
    const viewId = viewToShow ? viewToShow.id : null;
    
    // Actualizar tabs activos (nuevo selector para Floating Tab Bar)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === viewId) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar/ocultar botón "Volver" según la vista activa
    const backButton = document.getElementById('back-button');
    if (backButton) {
        if (viewId === 'dashboard-view' || viewId === 'biblioteca-view' || viewId === 'perfil-view') {
            backButton.style.display = 'none';
        } else {
            backButton.style.display = 'block';
        }
    }
    
    // Mostrar/ocultar header de perfil solo en dashboard-view
    const headerLeft = document.querySelector('.header-left');
    if (headerLeft) {
        if (viewId === 'dashboard-view') {
            headerLeft.style.display = 'flex';
        } else {
            headerLeft.style.display = 'none';
        }
    }
}

// Función para renderizar la vista completa del dashboard
export function renderizarDashboardView(entrenos, onEntrenoClick, onBibliotecaClick) {
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
    
    // Agregar event listeners a las tarjetas de entrenos
    const cards = dashboardView.querySelectorAll('.entreno-card[data-entreno-id]');
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

// Función para renderizar la vista completa de entreno (solo el esqueleto con spinner)
export function renderizarEntrenoView(entreno) {
    actualizarReferenciasDOM();
    
    const entrenoHTML = `
        <h2 id="entreno-titulo">${entreno.nombre}</h2>
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
        <div id="lista-ejercicios-container" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        <button id="btn-anadir-ejercicio" class="btn btn-anadir">Añadir Ejercicio</button>
        
        <!-- Modal para seleccionar ejercicio de la biblioteca -->
        <div id="modal-seleccion-ejercicio" class="modal" style="display: none;"></div>
        
        <!-- Modal para nuevo ejercicio (mantener por si se necesita en el futuro) -->
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
}

// Función para renderizar la lista de ejercicios (reemplaza el spinner)
export function renderizarListaEjercicios(ejercicios, onEditarClick, onEliminarClick, onEjercicioClick, onSustituirClick, onToggleCompletado) {
    actualizarReferenciasDOM();
    
    const listaContainer = document.getElementById('lista-ejercicios-container');
    if (!listaContainer) {
        console.error('lista-ejercicios-container no encontrado');
        return;
    }
    
    // Limpiar el contenedor (remover el spinner)
    listaContainer.innerHTML = '';
    
    if (ejercicios.length === 0) {
        listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios agregados aún</p>';
        return;
    }
    
    // Separar ejercicios en pendientes y completados
    // Filtrar estrictamente: pendientes son los que NO están completados hoy
    const pendientes = ejercicios.filter(ej => !ej.isCompletedToday);
    const completados = ejercicios.filter(ej => ej.isCompletedToday === true);
    
    // Función para renderizar una tarjeta de ejercicio
    const renderizarTarjeta = (ejercicio, esCompletado) => {
        const card = document.createElement('div');
        card.className = 'ejercicio-card' + (esCompletado ? ' card-completed' : '');
        card.style.cursor = 'pointer';
        card.dataset.ejercicioId = ejercicio.id;
        
        card.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="btn-check" ${ejercicio.isCompletedToday ? 'checked' : ''} data-ejercicio-id="${ejercicio.id}">
            </div>
            <div class="ejercicio-card-content">
                <div class="ejercicio-card-content-wrapper">
                    <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-card-image">
                    <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
                </div>
            </div>
            <div class="ejercicio-card-actions">
                <button class="btn-sustituir" data-ejercicio-id="${ejercicio.id}" title="Sustituir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                    </svg>
                </button>
                <button class="btn-eliminar" data-ejercicio-id="${ejercicio.id}" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            ${!ejercicio.isCompletedToday ? '<div class="drag-handle" draggable="true">::</div>' : '<div class="drag-placeholder"></div>'}
        `;
        
        // Agregar event listener para hacer clic en la tarjeta (navegar a vista de ejercicio)
        if (onEjercicioClick) {
            card.addEventListener('click', function(e) {
                // No navegar si se hace clic en los botones, el drag handle, checkbox o si se está arrastrando
                if (!e.target.closest('.ejercicio-card-actions') && 
                    !e.target.closest('.drag-handle') && 
                    !e.target.closest('.checkbox-container') &&
                    !card.classList.contains('dragging')) {
                    onEjercicioClick(ejercicio.id);
                }
            });
        }
        
        // Agregar event listener para el checkbox
        if (onToggleCompletado) {
            const checkbox = card.querySelector('.btn-check');
            if (checkbox) {
                checkbox.addEventListener('change', function(e) {
                    e.stopPropagation();
                    const ejercicioId = parseInt(this.dataset.ejercicioId);
                    onToggleCompletado(ejercicioId);
                });
            }
        }
        
        return card;
    };
    
    // Renderizar ejercicios pendientes primero
    pendientes.forEach(ejercicio => {
        const card = renderizarTarjeta(ejercicio, false);
        listaContainer.appendChild(card);
    });
    
    // Añadir separador visual si hay completados
    if (completados.length > 0) {
        const separador = document.createElement('h3');
        separador.className = 'section-title completados-title';
        separador.textContent = 'COMPLETADOS';
        listaContainer.appendChild(separador);
        
        // Renderizar ejercicios completados
        completados.forEach(ejercicio => {
            const card = renderizarTarjeta(ejercicio, true);
            listaContainer.appendChild(card);
        });
    }
    
    // Agregar event listeners a los botones
    const botonesEliminar = listaContainer.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const ejercicioId = parseInt(this.dataset.ejercicioId);
            onEliminarClick(ejercicioId, this); // Pasar el botón como segundo parámetro
        });
    });
    
    if (onSustituirClick) {
        const botonesSustituir = listaContainer.querySelectorAll('.btn-sustituir');
        botonesSustituir.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const ejercicioId = parseInt(this.dataset.ejercicioId);
                onSustituirClick(ejercicioId);
            });
        });
    }
    
    // Actualizar referencia a listaEjercicios para compatibilidad con otras funciones
    actualizarReferenciasDOM();
}

// Función para renderizar la vista de biblioteca (solo el esqueleto con spinner)
export function renderizarBibliotecaView() {
    actualizarReferenciasDOM();
    
    const bibliotecaView = document.getElementById('biblioteca-view');
    if (!bibliotecaView) {
        console.error('biblioteca-view no encontrado');
        return;
    }
    
    const bibliotecaHTML = `
        <h2 id="biblioteca-titulo">CATEGORÍAS</h2>
        <div id="lista-categorias" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        <button id="btn-anadir-categoria" class="btn btn-anadir">Añadir Categoría</button>
        
        <!-- Modal para nueva categoría -->
        <div id="modal-nueva-categoria" class="modal">
            <div class="modal-content">
                <h3>Nueva Categoría</h3>
                <form id="form-nueva-categoria">
                    <div class="form-group">
                        <label for="nombre-categoria">Nombre de la Categoría</label>
                        <input type="text" id="nombre-categoria" name="nombre" placeholder="Ej: Pecho, Bíceps, Piernas..." required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-categoria" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    bibliotecaView.innerHTML = bibliotecaHTML;
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la vista de ejercicios de categoría (solo el esqueleto con spinner)
export function renderizarCategoriaEjerciciosView(categoriaNombre) {
    actualizarReferenciasDOM();
    
    const categoriaEjerciciosView = document.getElementById('categoria-ejercicios-view');
    if (!categoriaEjerciciosView) {
        console.error('categoria-ejercicios-view no encontrado');
        return;
    }
    
    const categoriaEjerciciosHTML = `
        <h2 id="categoria-ejercicios-titulo">${categoriaNombre.toUpperCase()}</h2>
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
        <div id="lista-ejercicios-categoria-container" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        <button id="btn-anadir-ejercicio-categoria" class="btn btn-anadir">Añadir Ejercicio</button>
        
        <!-- Modal para nuevo ejercicio de categoría -->
        <div id="modal-nuevo-ejercicio-categoria" class="modal">
            <div class="modal-content">
                <h3 id="modal-ejercicio-categoria-titulo">Nuevo Ejercicio</h3>
                <form id="form-nuevo-ejercicio-categoria">
                    <div class="form-group">
                        <label for="nombre-ejercicio-categoria">Nombre del ejercicio</label>
                        <input type="text" id="nombre-ejercicio-categoria" name="nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="imagen-ejercicio-categoria">Subir imagen</label>
                        <input type="file" id="imagen-ejercicio-categoria" name="imagen" accept="image/*" required>
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-ejercicio-categoria" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    categoriaEjerciciosView.innerHTML = categoriaEjerciciosHTML;
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la lista de ejercicios de categoría (reemplaza el spinner)
export function renderizarListaEjerciciosCategoria(ejercicios, onEditarClick, onEliminarClick) {
    actualizarReferenciasDOM();
    
    const listaContainer = document.getElementById('lista-ejercicios-categoria-container');
    if (!listaContainer) {
        console.error('lista-ejercicios-categoria-container no encontrado');
        return;
    }
    
    // CRÍTICO: Limpiar el contenedor ANTES de renderizar para evitar duplicados
    listaContainer.innerHTML = '';
    
    if (ejercicios.length === 0) {
        listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios en esta categoría aún</p>';
        return;
    }
    
    // Renderizar las tarjetas de ejercicios
    ejercicios.forEach(ejercicio => {
        const card = document.createElement('div');
        card.className = 'ejercicio-card library-mode';
        card.dataset.ejercicioId = ejercicio.id;
        
        card.innerHTML = `
            <div class="ejercicio-card-content">
                <div class="ejercicio-card-content-wrapper">
                    <img src="${obtenerImagenSegura(ejercicio.imagenUrl)}" alt="${ejercicio.nombre}" class="ejercicio-card-image" onerror="this.onerror=null; this.src='./images/favicon.png';">
                    <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
                </div>
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
        
        listaContainer.appendChild(card);
    });
    
    // Agregar event listeners a los botones
    if (onEliminarClick) {
        const botonesEliminar = listaContainer.querySelectorAll('.btn-eliminar');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const ejercicioId = this.dataset.ejercicioId;
                onEliminarClick(ejercicioId, this);
            });
        });
    }
    
    if (onEditarClick) {
        const botonesEditar = listaContainer.querySelectorAll('.btn-editar');
        botonesEditar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const ejercicioId = this.dataset.ejercicioId;
                onEditarClick(ejercicioId);
            });
        });
    }
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la lista de categorías (reemplaza el spinner)
export function renderizarListaCategorias(categorias, onEditarClick, onEliminarClick, onCategoriaClick) {
    actualizarReferenciasDOM();
    
    const listaContainer = document.getElementById('lista-categorias');
    if (!listaContainer) {
        console.error('lista-categorias no encontrado');
        return;
    }
    
    // Limpiar el contenedor (remover el spinner)
    listaContainer.innerHTML = '';
    
    if (categorias.length === 0) {
        listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay categorías aún</p>';
        return;
    }
    
    // Renderizar las tarjetas de categorías
    categorias.map((categoria, index) => {
        const card = document.createElement('div');
        card.className = 'categoria-card';
        card.dataset.categoriaId = categoria.id;
        
        card.innerHTML = `
            <div class="categoria-numero">
                <span>${index + 1}</span>
            </div>
            <span class="categoria-nombre">${categoria.nombre}</span>
            <div class="categoria-botones">
                <button class="btn-editar" data-categoria-id="${categoria.id}" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-eliminar" data-categoria-id="${categoria.id}" title="Eliminar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        listaContainer.appendChild(card);
    });
    
    // Agregar event listener para hacer clic en la tarjeta (navegar a ejercicios de categoría)
    if (onCategoriaClick) {
        const cards = listaContainer.querySelectorAll('.categoria-card');
        cards.forEach(card => {
            card.addEventListener('click', function(e) {
                // No navegar si se hace clic en los botones
                if (!e.target.closest('.categoria-botones')) {
                    const categoriaId = card.dataset.categoriaId;
                    const categoria = categorias.find(c => c.id === categoriaId);
                    if (categoria) {
                        onCategoriaClick(categoriaId, categoria.nombre);
                    }
                }
            });
        });
    }
    
    // Agregar event listeners a los botones
    if (onEliminarClick) {
        const botonesEliminar = listaContainer.querySelectorAll('.categoria-botones .btn-eliminar');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const categoriaId = this.dataset.categoriaId;
                onEliminarClick(categoriaId, this);
            });
        });
    }
    
    if (onEditarClick) {
        const botonesEditar = listaContainer.querySelectorAll('.categoria-botones .btn-editar');
        botonesEditar.forEach(boton => {
            boton.addEventListener('click', function(e) {
                e.stopPropagation();
                const categoriaId = this.dataset.categoriaId;
                onEditarClick(categoriaId);
            });
        });
    }
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la lista de ejercicios de la biblioteca (reemplaza el spinner) - DEPRECATED
export function renderizarListaBiblioteca(ejercicios, onEditarClick, onEliminarClick) {
    actualizarReferenciasDOM();
    
    const listaContainer = document.getElementById('lista-biblioteca-container');
    if (!listaContainer) {
        console.error('lista-biblioteca-container no encontrado');
        return;
    }
    
    // Limpiar el contenedor (remover el spinner)
    listaContainer.innerHTML = '';
    
    if (ejercicios.length === 0) {
        listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios en la biblioteca aún</p>';
        return;
    }
    
    // Renderizar las tarjetas de ejercicios
    ejercicios.forEach(ejercicio => {
        const card = document.createElement('div');
        card.className = 'ejercicio-card library-mode';
        card.dataset.ejercicioId = ejercicio.id;
        
        card.innerHTML = `
            <div class="ejercicio-card-content">
                <div class="ejercicio-card-content-wrapper">
                    <img src="${obtenerImagenSegura(ejercicio.imagenUrl)}" alt="${ejercicio.nombre}" class="ejercicio-card-image" onerror="this.onerror=null; this.src='./images/favicon.png';">
                    <div>
                        <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">${ejercicio.etiqueta || 'Sin etiqueta'}</p>
                    </div>
                </div>
            </div>
            <div class="ejercicio-card-actions">
                <button class="btn-editar" data-ejercicio-id="${ejercicio.id}" title="Editar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="btn-sustituir" data-ejercicio-id="${ejercicio.id}" title="Sustituir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
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
        
        listaContainer.appendChild(card);
    });
    
    // Agregar event listeners a los botones
    const botonesEliminar = listaContainer.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const ejercicioId = this.dataset.ejercicioId;
            onEliminarClick(ejercicioId, this);
        });
    });
    
    const botonesEditar = listaContainer.querySelectorAll('.btn-editar');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.stopPropagation();
            const ejercicioId = this.dataset.ejercicioId;
            onEditarClick(ejercicioId);
        });
    });
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
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
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
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
                <button class="btn-sustituir" data-ejercicio-id="${ejercicio.id}" title="Sustituir">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
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
        
        // Mostrar ambos botones
        btnYes.style.display = 'block';
        btnNo.style.display = 'block';
        btnYes.textContent = 'Sí, Eliminar';
        btnYes.className = 'btn-danger';
        
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

// Función para mostrar modal de información (un solo botón)
export function showInfoModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const btnYes = document.getElementById('modal-btn-yes');
        const btnNo = document.getElementById('modal-btn-no');
        
        if (!modal || !modalTitle || !modalMessage || !btnYes || !btnNo) {
            console.error('Elementos del modal de confirmación no encontrados');
            resolve();
            return;
        }
        
        // Establecer título y mensaje
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Ocultar el botón "No" y cambiar el texto del botón "Sí" a "Entendido"
        btnNo.style.display = 'none';
        btnYes.style.display = 'block';
        btnYes.textContent = 'Entendido';
        btnYes.className = 'btn-secondary';
        
        // Mostrar el modal
        modal.style.display = 'flex';
        
        // Función para cerrar el modal
        const closeModal = () => {
            modal.style.display = 'none';
            // Restaurar el botón "No" para futuros usos
            btnNo.style.display = 'block';
            // Remover listener para evitar memory leaks
            btnYes.removeEventListener('click', handleOk);
            resolve();
        };
        
        // Handler para "Entendido"
        const handleOk = () => {
            closeModal();
        };
        
        // Añadir listener
        btnYes.addEventListener('click', handleOk);
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

export function getBibliotecaView() {
    actualizarReferenciasDOM();
    return document.getElementById('biblioteca-view');
}

export function getCategoriaEjerciciosView() {
    actualizarReferenciasDOM();
    return document.getElementById('categoria-ejercicios-view');
}

// Función para actualizar los breadcrumbs
export function actualizarBreadcrumbs(links, onNavigate) {
    const breadcrumbsContainer = document.getElementById('breadcrumbs');
    if (!breadcrumbsContainer) {
        return;
    }
    
    if (!links || links.length === 0) {
        breadcrumbsContainer.innerHTML = '';
        return;
    }
    
    // Generar HTML de los breadcrumbs
    const breadcrumbsHTML = links.map((link, index) => {
        const isLast = index === links.length - 1;
        const separator = index < links.length - 1 ? '<span class="breadcrumb-separator">></span>' : '';
        
        if (isLast || !link.vista) {
            // Último elemento o sin vista (no clickeable)
            return `<span class="breadcrumb-item">${link.texto}</span>${separator}`;
        } else {
            // Elemento clickeable
            return `<span class="breadcrumb-item" data-vista="${link.vista}" data-action="${link.action || ''}" data-param="${link.param || ''}">${link.texto}</span>${separator}`;
        }
    }).join('');
    
    breadcrumbsContainer.innerHTML = breadcrumbsHTML;
    
    // Agregar event listeners a los breadcrumbs clickeables
    if (onNavigate) {
        const clickableItems = breadcrumbsContainer.querySelectorAll('.breadcrumb-item:not(:last-child)');
        clickableItems.forEach(item => {
            item.addEventListener('click', function() {
                const vista = this.dataset.vista;
                const action = this.dataset.action;
                const param = this.dataset.param;
                
                if (onNavigate) {
                    onNavigate(vista, action, param);
                }
            });
        });
    }
}

// Función para renderizar la vista de perfil
export function renderizarPerfilView() {
    actualizarReferenciasDOM();
    
    const perfilView = document.getElementById('perfil-view');
    if (!perfilView) {
        console.error('perfil-view no encontrado');
        return;
    }
    
    const perfilHTML = `
        <h1>MI PERFIL</h1>
        <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
            <p>Próximamente: Datos corporales y estadísticas</p>
        </div>
    `;
    
    perfilView.innerHTML = perfilHTML;
}

// Función para renderizar el modal de selección de ejercicios
export function renderizarModalSeleccionEjercicio(ejerciciosPorCategoria) {
    const modal = document.getElementById('modal-seleccion-ejercicio');
    if (!modal) {
        console.error('modal-seleccion-ejercicio no encontrado');
        return;
    }
    
    // Si los datos son null, mostrar estado de carga
    if (ejerciciosPorCategoria === null || ejerciciosPorCategoria === undefined) {
        modal.innerHTML = `
            <div class="modal-content">
                <h3>SELECCIONAR EJERCICIO</h3>
                <div class="modal-seleccion-container" style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
                    <div class="loader-spinner" style="margin: 40px auto;"></div>
                </div>
                <div class="modal-buttons">
                    <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
        return;
    }
    
    // Si hay datos pero están vacíos, mostrar mensaje
    if (ejerciciosPorCategoria.length === 0) {
        modal.innerHTML = `
            <div class="modal-content">
                <h3>SELECCIONAR EJERCICIO</h3>
                <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    No hay ejercicios disponibles en la biblioteca.
                </p>
                <div class="modal-buttons">
                    <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                </div>
            </div>
        `;
        return;
    }
    
    const categoriasHTML = ejerciciosPorCategoria.map((item, index) => {
        const ejerciciosHTML = item.ejercicios.map(ejercicio => `
            <div class="ejercicio-seleccion-item" data-ejercicio-id="${ejercicio.bibliotecaId}" data-categoria-id="${ejercicio.categoriaId}">
                <img src="${ejercicio.imagenUrl || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27100%27 height=%27100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23333%27/%3E%3Ctext x=%2750%27 y=%2750%27 text-anchor=%27middle%27 fill=%27white%27 font-size=%2714%27%3EEjercicio%3C/text%3E%3C/svg%3E'}" 
                     alt="${ejercicio.nombre}" 
                     class="ejercicio-seleccion-imagen">
                <span class="ejercicio-seleccion-nombre">${ejercicio.nombre}</span>
            </div>
        `).join('');
        
        return `
            <div class="categoria-seleccion-item">
                <button class="categoria-seleccion-header" data-categoria-index="${index}">
                    <span>${item.categoria.nombre}</span>
                    <span class="categoria-seleccion-icon">▼</span>
                </button>
                <div class="categoria-seleccion-ejercicios" id="ejercicios-categoria-${index}" style="display: none;">
                    ${ejerciciosHTML}
                </div>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>SELECCIONAR EJERCICIO</h3>
            <div class="modal-seleccion-container">
                ${categoriasHTML}
            </div>
            <div class="modal-buttons">
                <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    `;
}

