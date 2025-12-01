// ui.js - Lógica de manipulación del DOM

import { obtenerUltimoRegistro } from './storage.js';

/**
 * Muestra una notificación Toast en la pantalla
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de toast: 'success', 'error', 'info' (default: 'info')
 * @param {number} duracion - Duración en milisegundos (default: 3000)
 */
export function showToast(mensaje, tipo = 'info', duracion = 3000) {
    // Eliminar toast existente si hay uno
    const toastExistente = document.querySelector('.toast-notification');
    if (toastExistente) {
        toastExistente.classList.remove('show');
        toastExistente.classList.add('hide');
        setTimeout(() => {
            toastExistente.remove();
        }, 300);
    }
    
    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${tipo}`;
    toast.textContent = mensaje;
    
    // Insertar en el body
    document.body.appendChild(toast);
    
    // Forzar reflow para que la animación funcione
    void toast.offsetWidth;
    
    // Mostrar con animación
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Ocultar y eliminar después de la duración
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duracion);
}

/**
 * Aplica el tema del perfil seleccionado actualizando las variables CSS y el meta tag
 * @param {Object} perfil - Objeto del perfil con la propiedad theme
 */
export function aplicarTema(perfil) {
    if (!perfil || !perfil.theme) return;

    const root = document.documentElement;
    
    // 1. Cambiar Variables CSS
    root.style.setProperty('--accent-color', perfil.theme.primary);
    root.style.setProperty('--accent-hover', perfil.theme.hover);
    
    // 2. Cambiar color de la barra del navegador (Meta Theme Color)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', perfil.theme.primary);
    }
}

// Función auxiliar para formatear fecha visual sin problemas de timezone
export function formatearFechaVisual(fechaString) {
    if (!fechaString) return '--';
    
    // Asume formato YYYY-MM-DD
    if (typeof fechaString === 'string' && fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const partes = fechaString.split('-');
        if (partes.length === 3) {
            const [year, month, day] = partes;
            return `${day}/${month}/${year}`; // Formato local simple DD/MM/YYYY
        }
    }
    
    // Si no es el formato esperado, devolver tal cual
    return fechaString;
}

// Función auxiliar para formatear fecha corta (día y mes corto) sin problemas de timezone
function formatearFechaCorta(fechaString) {
    if (!fechaString) return '--';
    
    // Asume formato YYYY-MM-DD
    if (typeof fechaString === 'string' && fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const partes = fechaString.split('-');
        if (partes.length === 3) {
            const [year, month, day] = partes;
            const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
            const mesIndex = parseInt(month, 10) - 1;
            const mesCorto = meses[mesIndex] || month;
            return `${day} ${mesCorto}`; // Formato: "21 nov"
        }
    }
    
    // Si no es el formato esperado, devolver tal cual
    return fechaString;
}

// Configuración de métricas corporales
const METRICAS_CONFIG = {
    peso: { label: 'PESO', unit: 'kg' }, // El peso depende de la altura, difícil dar rango fijo aquí
    imc: { 
        label: 'I.M.C', 
        unit: '', 
        ranges: [
            {max: 18.5, label: 'Bajo', color: 'var(--accent-color)'}, 
            {max: 24.9, label: 'Normal', color: '#28a745'}, 
            {max: 999, label: 'Alto', color: '#dc3545'}
        ] 
    },
    grasa: { 
        label: 'GRASA CORPORAL', 
        unit: '%', 
        ranges: [
            {max: 10, label: 'Bajo', color: 'var(--accent-color)'}, 
            {max: 20, label: 'Normal', color: '#28a745'}, 
            {max: 999, label: 'Alto', color: '#dc3545'}
        ] 
    },
    musculo: { 
        label: 'MASA MUSCULAR', 
        unit: '%', 
        ranges: [
            {max: 33, label: 'Bajo', color: 'var(--accent-color)'}, 
            {max: 999, label: 'Alto/Bueno', color: '#28a745'}
        ] 
    },
    hueso: { 
        label: 'MASA ÓSEA', 
        unit: 'kg', 
        ranges: [
            {max: 2.5, label: 'Bajo', color: 'var(--accent-color)'}, 
            {max: 3.5, label: 'Normal', color: '#28a745'}, 
            {max: 999, label: 'Alto', color: '#dc3545'}
        ] 
    },
    agua: { 
        label: 'AGUA', 
        unit: '%', 
        ranges: [
            {max: 50, label: 'Bajo', color: 'var(--accent-color)'}, 
            {max: 65, label: 'Normal', color: '#28a745'}, 
            {max: 999, label: 'Alto', color: '#dc3545'}
        ] 
    },
    metabolismo: { label: 'METABOLISMO BASAL', unit: 'kcal' },
    visceral: { 
        label: 'GRASA VISCERAL', 
        unit: '', 
        ranges: [
            {max: 9, label: 'Normal', color: '#28a745'}, 
            {max: 999, label: 'Alto/Peligro', color: '#dc3545'}
        ] 
    }
};

// Función auxiliar para obtener el rango de una métrica
function obtenerRangoMetrica(metricaKey, valor) {
    if (!valor || valor === null || valor === undefined) {
        return null;
    }
    
    const config = METRICAS_CONFIG[metricaKey];
    if (!config || !config.ranges) {
        return null;
    }
    
    for (const range of config.ranges) {
        if (valor <= range.max) {
            return { label: range.label, color: range.color };
        }
    }
    
    return null;
}

// Referencias a elementos del DOM (se actualizarán después de renderizar)
let dashboardView = null;
let entrenoView = null;
let ejercicioView = null;
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

// Función auxiliar para renderizar el botón volver flotante
function renderizarBotonVolver() {
    return `
      <button id="btn-volver-float" class="btn-volver-flotante" aria-label="Regresar">
        <svg viewBox="0 0 24 24" class="icon-back">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    `;
  }

// Función para actualizar referencias a elementos del DOM
function actualizarReferenciasDOM() {
    dashboardView = document.getElementById('dashboard-view');
    entrenoView = document.getElementById('entreno-view');
    ejercicioView = document.getElementById('ejercicio-view');
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
    // Ocultar TODAS las vistas explícitamente usando el selector común
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none';
    });
    
    // Mostrar la vista solicitada
    if (viewToShow) {
        viewToShow.classList.add('active');
        viewToShow.style.display = 'flex';
    }
    
    // Obtener el ID de la vista activa
    const viewId = viewToShow ? viewToShow.id : null;
    
    // Actualizar referencias DOM después de cambiar las vistas
    actualizarReferenciasDOM();
    
    // Actualizar tabs activos (nuevo selector para Floating Tab Bar)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === viewId) {
            tab.classList.add('active');
        }
    });
    
    // Mostrar/ocultar botón "Volver" flotante según la vista activa
    const btnVolverFloat = document.getElementById('btn-volver-float');
    if (btnVolverFloat) {
        // Ocultar en vistas principales, mostrar en sub-vistas
        if (viewId === 'dashboard-view' || viewId === 'biblioteca-view' || viewId === 'perfil-view' || viewId === 'calendario-view') {
            btnVolverFloat.style.display = 'none';
        } else {
            btnVolverFloat.style.display = 'flex';
        }
    }
    
    // Mostrar/ocultar botón "Volver" según la vista activa
    const backButton = document.getElementById('back-button');
    if (backButton) {
        if (viewId === 'dashboard-view' || viewId === 'biblioteca-view' || viewId === 'perfil-view' || viewId === 'calendario-view') {
            backButton.style.display = 'none';
        } else {
            backButton.style.display = 'block';
        }
    }
    
    // Ocultar header completo en todas las vistas
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) {
        mainHeader.style.display = 'none';
    }
}

// Función para renderizar la vista completa del dashboard
export function renderizarDashboardView(entrenos, onEntrenoClick) {
    actualizarReferenciasDOM();
    
    const dashboardHTML = `
        <h1>ENTRENOS</h1>
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


// Función para renderizar la vista completa de entreno (solo el esqueleto con spinner)
export function renderizarEntrenoView(entreno) {
    actualizarReferenciasDOM();
    
    const entrenoHTML = `
        ${renderizarBotonVolver()}
        <h2 id="entreno-titulo">${entreno.nombre}</h2>
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
        <div class="progress-wrapper">
            <div class="progress-header">
                <span class="progress-label">PROGRESO DIARIO</span>
                <span id="progress-percent" class="progress-percent">0%</span>
            </div>
            <div class="progress-track">
                <div id="progress-fill" class="progress-fill" style="width: 0%;"></div>
            </div>
            <p id="progress-text" class="progress-detail">0 de 0 ejercicios</p>
        </div>
        <div id="lista-ejercicios-container" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        
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
        return;
    }
    
    // Limpiar el contenedor (remover el spinner)
    listaContainer.innerHTML = '';
    
    // Separar ejercicios en pendientes y completados
    // Filtrar estrictamente: pendientes son los que NO están completados hoy
    const pendientes = ejercicios.filter(ej => !ej.isCompletedToday);
    const completados = ejercicios.filter(ej => ej.isCompletedToday === true);
    
    // Función para renderizar una tarjeta de ejercicio
    const renderizarTarjeta = (ejercicio, esCompletado) => {
        // Verificar si es un ejercicio huérfano
        const esHuerfano = ejercicio.isOrphan === true;
        
        const card = document.createElement('div');
        let className = 'ejercicio-card';
        if (esCompletado) className += ' card-completed';
        if (esHuerfano) className += ' orphan';
        card.className = className;
        card.style.cursor = esHuerfano ? 'default' : 'pointer';
        card.dataset.ejercicioId = ejercicio.id;
        
        // Si es huérfano, renderizar tarjeta especial
        if (esHuerfano) {
            const imagenUrl = ejercicio.imagenUrl || ejercicio.imagenBase64 || './images/favicon.png';
            card.innerHTML = `
                <div class="ejercicio-card-content" style="grid-column: 1 / -1;">
                    <div class="ejercicio-card-content-wrapper">
                        <img src="${imagenUrl}" alt="${ejercicio.nombre}" class="ejercicio-card-image" style="filter: grayscale(100%); opacity: 0.5;">
                        <div>
                            <h3 class="ejercicio-card-title" style="color: var(--text-secondary);">${ejercicio.nombre}</h3>
                            <p style="color: #dc3545; font-size: 12px; margin-top: 4px;">Ejercicio No Disponible</p>
                        </div>
                    </div>
                </div>
                <div class="ejercicio-card-actions" style="grid-column: 3;">
                    <button class="btn-eliminar" data-ejercicio-id="${ejercicio.id}" title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            // Tarjeta normal
            card.innerHTML = `
                <div class="checkbox-container">
                    <input type="checkbox" class="btn-check" ${ejercicio.isCompletedToday ? 'checked' : ''} data-ejercicio-id="${ejercicio.id}">
                </div>
                <div class="ejercicio-card-content">
                    <div class="ejercicio-card-content-wrapper">
                        <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-card-image">
                        <div>
                            ${ejercicio.nombreCategoria ? `<span class="ejercicio-tag">${ejercicio.nombreCategoria}</span>` : ''}
                            <h3 class="ejercicio-card-title">${ejercicio.nombre}</h3>
                        </div>
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
            `;
            
            // Agregar event listener para hacer clic en la tarjeta (navegar a vista de ejercicio) - solo si no es huérfano
            if (onEjercicioClick) {
                card.addEventListener('click', function(e) {
                    // No navegar si se hace clic en los botones o checkbox
                    if (!e.target.closest('.ejercicio-card-actions') && 
                        !e.target.closest('.checkbox-container')) {
                        onEjercicioClick(ejercicio.id);
                    }
                });
            }
            
            // Agregar event listener para el checkbox - solo si no es huérfano
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
        }
        
        return card;
    };
    
    // Crear contenedor para ejercicios pendientes
    const listaPendientes = document.createElement('div');
    listaPendientes.id = 'lista-pendientes';
    
    // Renderizar ejercicios pendientes
    if (pendientes.length === 0 && ejercicios.length === 0) {
        // Caso: lista completamente vacía
        listaPendientes.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay ejercicios agregados aún</p>';
    } else {
        pendientes.forEach(ejercicio => {
            const card = renderizarTarjeta(ejercicio, false);
            listaPendientes.appendChild(card);
        });
    }
    
    listaContainer.appendChild(listaPendientes);
    
    // Añadir botón "Añadir Ejercicio" en contenedor inline (siempre visible)
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container-inline';
    const btnAnadir = document.createElement('button');
    btnAnadir.id = 'btn-anadir-ejercicio';
    btnAnadir.className = 'btn btn-anadir';
    btnAnadir.textContent = 'Añadir Ejercicio';
    btnContainer.appendChild(btnAnadir);
    listaContainer.appendChild(btnContainer);
    
    // Añadir separador visual y completados si existen
    if (completados.length > 0) {
        const separador = document.createElement('h3');
        separador.className = 'section-title completados-title';
        separador.textContent = 'COMPLETADOS';
        listaContainer.appendChild(separador);
        
        // Crear contenedor para ejercicios completados
        const listaCompletados = document.createElement('div');
        listaCompletados.id = 'lista-completados';
        
        // Renderizar ejercicios completados
        completados.forEach(ejercicio => {
            const card = renderizarTarjeta(ejercicio, true);
            listaCompletados.appendChild(card);
        });
        
        listaContainer.appendChild(listaCompletados);
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
        return;
    }
    
    const bibliotecaHTML = `
        <h2 id="biblioteca-titulo">CATEGORÍAS</h2>
        <div id="lista-categorias" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        <div class="btn-container-inline">
            <button id="btn-anadir-categoria" class="btn btn-anadir">Añadir Categoría</button>
        </div>
        
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
        return;
    }
    
    const categoriaEjerciciosHTML = `
        ${renderizarBotonVolver()}
        <h2 id="categoria-ejercicios-titulo">${categoriaNombre.toUpperCase()}</h2>
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
        <div id="lista-ejercicios-categoria-container" class="lista-ejercicios">
            <div class="loader-spinner" style="margin: 40px auto;"></div>
        </div>
        <div class="btn-container-inline">
            <button id="btn-anadir-ejercicio-categoria" class="btn btn-anadir">Añadir Ejercicio</button>
        </div>
        
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
        
        const imagenUrl = obtenerImagenSegura(ejercicio.imagenUrl);
        
        card.innerHTML = `
            <div class="ejercicio-card-content">
                <div class="ejercicio-card-content-wrapper">
                    <img src="${imagenUrl}" alt="${ejercicio.nombre}" class="ejercicio-card-image preview-image" data-image-url="${imagenUrl}" data-image-alt="${ejercicio.nombre}" onerror="this.onerror=null; this.src='./images/favicon.png';" style="cursor: pointer;">
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
    
    // Agregar event listeners para previsualización de imágenes
    const imagenesPreview = listaContainer.querySelectorAll('.preview-image');
    imagenesPreview.forEach(imagen => {
        imagen.addEventListener('click', function(e) {
            e.stopPropagation();
            const imageUrl = this.dataset.imageUrl;
            const imageAlt = this.dataset.imageAlt || 'Vista previa';
            
            // Mostrar modal de previsualización
            const modalPreview = document.getElementById('modal-preview');
            const previewImage = document.getElementById('preview-image');
            const closePreview = document.getElementById('close-preview');
            
            if (modalPreview && previewImage) {
                previewImage.src = imageUrl;
                previewImage.alt = imageAlt;
                modalPreview.style.display = 'flex';
                modalPreview.classList.add('active');
                
                // Cerrar modal al hacer clic en el botón de cerrar
                if (closePreview) {
                    closePreview.onclick = function() {
                        modalPreview.style.display = 'none';
                        modalPreview.classList.remove('active');
                    };
                }
                
                // Cerrar modal al hacer clic fuera de la imagen
                modalPreview.onclick = function(e) {
                    if (e.target === modalPreview) {
                        modalPreview.style.display = 'none';
                        modalPreview.classList.remove('active');
                    }
                };
            }
        });
    });
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la lista de categorías (reemplaza el spinner)
export function renderizarListaCategorias(categorias, onEditarClick, onEliminarClick, onCategoriaClick) {
    actualizarReferenciasDOM();
    
    const listaContainer = document.getElementById('lista-categorias');
    if (!listaContainer) {
        return;
    }
    
    // Limpiar el contenedor (remover el spinner)
    listaContainer.innerHTML = '';
    
    if (categorias.length === 0) {
        listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay categorías aún</p>';
        return;
    }
    
    // Renderizar las tarjetas de categorías en grid de 2 columnas
    categorias.map((categoria, index) => {
        const card = document.createElement('div');
        card.className = 'categoria-card';
        card.dataset.categoriaId = categoria.id;
        
        card.innerHTML = `
            <div class="categoria-card-content">
                <div class="categoria-numero-badge">
                    <span>${index + 1}</span>
                </div>
                <span class="categoria-nombre">${categoria.nombre}</span>
            </div>
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
        
        const imagenUrl = obtenerImagenSegura(ejercicio.imagenUrl);
        
        card.innerHTML = `
            <div class="ejercicio-card-content">
                <div class="ejercicio-card-content-wrapper">
                    <img src="${imagenUrl}" alt="${ejercicio.nombre}" class="ejercicio-card-image preview-image" data-image-url="${imagenUrl}" data-image-alt="${ejercicio.nombre}" onerror="this.onerror=null; this.src='./images/favicon.png';" style="cursor: pointer;">
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
    
    // Agregar event listeners para previsualización de imágenes
    const imagenesPreview = listaContainer.querySelectorAll('.preview-image');
    imagenesPreview.forEach(imagen => {
        imagen.addEventListener('click', function(e) {
            e.stopPropagation();
            const imageUrl = this.dataset.imageUrl;
            const imageAlt = this.dataset.imageAlt || 'Vista previa';
            
            // Mostrar modal de previsualización
            const modalPreview = document.getElementById('modal-preview');
            const previewImage = document.getElementById('preview-image');
            const closePreview = document.getElementById('close-preview');
            
            if (modalPreview && previewImage) {
                previewImage.src = imageUrl;
                previewImage.alt = imageAlt;
                modalPreview.style.display = 'flex';
                modalPreview.classList.add('active');
                
                // Cerrar modal al hacer clic en el botón de cerrar
                if (closePreview) {
                    closePreview.onclick = function() {
                        modalPreview.style.display = 'none';
                        modalPreview.classList.remove('active');
                    };
                }
                
                // Cerrar modal al hacer clic fuera de la imagen
                modalPreview.onclick = function(e) {
                    if (e.target === modalPreview) {
                        modalPreview.style.display = 'none';
                        modalPreview.classList.remove('active');
                    }
                };
            }
        });
    });
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
}

// Función para renderizar la vista completa de ejercicio (registro de progreso)
export function renderizarEjercicioView(ejercicio, registros, onEditarRegistroClick, onEliminarRegistroClick) {
    actualizarReferenciasDOM();
    
    // Obtener fecha de hoy en formato YYYY-MM-DD (fecha local)
    const obtenerFechaLocal = () => {
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, '0');
        const day = String(ahora.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const hoy = obtenerFechaLocal();
    
    const ejercicioHTML = `
        ${renderizarBotonVolver()}
        <h2 id="ejercicio-titulo">${ejercicio.nombre}</h2>
        <div id="breadcrumbs" class="breadcrumbs-container"></div>
        <img src="${ejercicio.imagenUrl || ejercicio.imagenBase64}" alt="${ejercicio.nombre}" class="ejercicio-view-image">
        
        <div class="registros-section">
            <h3>Historial de Registros</h3>
            <div id="lista-registros" class="lista-registros">
                <!-- Los registros se renderizarán aquí usando renderizarListaRegistros -->
            </div>
        </div>
        
        <button id="btn-abrir-modal-registro" class="btn btn-anadir">Añadir Registro</button>
        
        <!-- Modal para nuevo registro -->
        <div id="modal-nuevo-registro" class="modal">
            <div class="modal-content">
                <h3>Nuevo Registro</h3>
                <div id="ultimo-registro-info" class="last-record-info" style="display: none;">
                    <div class="last-record-header">
                        <span class="label">ANTERIOR:</span>
                        <span id="ultimo-registro-fecha" class="last-record-date">--</span>
                    </div>
                    <div id="ultimo-registro-series" class="last-record-series-grid">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
                <form id="form-nuevo-registro" class="form-registro">
                    <div class="form-group">
                        <label for="fecha-registro">Fecha</label>
                        <input type="date" id="fecha-registro" name="fecha" value="${hoy}" required>
                    </div>
                    
                    <div class="form-group">
                        <div class="registro-grid">
                            <!-- Encabezados -->
                            <span class="registro-header"></span>
                            <span class="registro-header">KGS</span>
                            <span class="registro-header">REPS</span>
                            
                            <!-- Filas de inputs -->
                            ${[1, 2, 3, 4].map(num => `
                                <span class="registro-index">${num}</span>
                                <input type="number" id="peso-serie-${num}" name="peso-${num}" placeholder="0" min="0" step="any">
                                <input type="number" id="rep-serie-${num}" name="rep-${num}" placeholder="0" min="0" step="any">
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notas-registro">Notas</label>
                        <textarea id="notas-registro" name="notas" rows="3" placeholder="Notas adicionales..."></textarea>
                    </div>
                    
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-registro" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    ejercicioView.innerHTML = ejercicioHTML;
    
    // Actualizar referencias después de renderizar
    actualizarReferenciasDOM();
    
    // Los registros se renderizarán después usando renderizarRegistrosPaginados()
    // No renderizamos aquí para permitir la paginación
}

// Función para renderizar solo la lista de registros (actualizar después de agregar)
export function renderizarListaRegistros(registros, onEditarRegistroClick, onEliminarRegistroClick, paginaActual = 1, totalPaginas = 1) {
    actualizarReferenciasDOM();
    
    const listaRegistros = document.getElementById('lista-registros');
    if (!listaRegistros) {
        return;
    }
    
    // Función auxiliar para formatear una serie
    const formatearSerie = (serie) => {
        if (serie && serie.peso && serie.repeticiones) {
            return `${serie.peso}kg x ${serie.repeticiones}`;
        }
        return '-';
    };
    
    let registrosHTML = registros && registros.length > 0
        ? registros.map(registro => {
            const series = registro.series || [];
            const fechaFormateada = formatearFechaVisual(registro.fecha);
            
            // Generar items de series (máximo 4)
            const seriesItems = [];
            for (let i = 0; i < 4; i++) {
                const serie = series[i];
                if (serie && serie.peso && serie.repeticiones) {
                    seriesItems.push(`
                        <div class="serie-item">
                            <span class="serie-label">S${i + 1}</span>
                            <span class="serie-value">${serie.peso}kg x ${serie.repeticiones}</span>
                        </div>
                    `);
                } else {
                    seriesItems.push(`
                        <div class="serie-item">
                            <span class="serie-label">S${i + 1}</span>
                            <span class="serie-value">-</span>
                        </div>
                    `);
                }
            }
            
            return `
                <div class="historial-card">
                    <div class="historial-header">
                        <span class="historial-date">${fechaFormateada}</span>
                        <div class="historial-actions">
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
                        </div>
                    </div>
                    <div class="historial-series-grid">
                        ${seriesItems.join('')}
                    </div>
                    ${registro.notas ? `<div class="historial-notes">Notas: ${registro.notas}</div>` : ''}
                </div>
            `;
        }).join('')
        : '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay registros aún</p>';
    
    // Añadir controles de paginación si es necesario
    if (totalPaginas > 1) {
        registrosHTML += `
            <div class="pagination-controls" style="margin-top: 20px;">
                <button id="btn-prev-ejercicio" class="btn-icon-small" ${paginaActual === 1 ? 'disabled' : ''}>❮</button>
                <span class="pagination-info">Página ${paginaActual} de ${totalPaginas}</span>
                <button id="btn-next-ejercicio" class="btn-icon-small" ${paginaActual === totalPaginas ? 'disabled' : ''}>❯</button>
            </div>
        `;
    }
    
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

// Función para mostrar el modal
export function mostrarModal() {
    actualizarReferenciasDOM();
    if (modalNuevoEjercicio) {
        modalNuevoEjercicio.classList.add('active');
    }
    // Ocultar botones flotantes cuando se muestra el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
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
    
    // Mostrar botones flotantes cuando se oculta el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'flex';
    });
    
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
// Parámetros opcionales: entrenoId y ejercicioId para obtener y mostrar el último registro
export async function mostrarModalRegistro(entrenoId = null, ejercicioId = null) {
    const modalRegistro = document.getElementById('modal-nuevo-registro');
    if (modalRegistro) {
        modalRegistro.classList.add('active');
    }
    
    // Establecer fecha actual en el input si es un nuevo registro
    const fechaInput = document.getElementById('fecha-registro');
    if (fechaInput && !fechaInput.value) {
        // Función auxiliar para obtener fecha local
        const obtenerFechaLocal = () => {
            const ahora = new Date();
            const year = ahora.getFullYear();
            const month = String(ahora.getMonth() + 1).padStart(2, '0');
            const day = String(ahora.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        fechaInput.value = obtenerFechaLocal();
    }
    
    // Obtener y mostrar el último registro si tenemos los IDs
    const ultimoRegistroInfo = document.getElementById('ultimo-registro-info');
    const form = document.getElementById('form-nuevo-registro');
    
    if (entrenoId && ejercicioId && ultimoRegistroInfo && form) {
        try {
            const ultimoRegistro = await obtenerUltimoRegistro(entrenoId, ejercicioId);
            
            if (ultimoRegistro) {
                // Mostrar el contenedor de referencia
                ultimoRegistroInfo.style.display = 'flex';
                
                // Formatear fecha
                const fechaFormateada = formatearFechaCorta(ultimoRegistro.fecha);
                const series = ultimoRegistro.series || [];
                
                // Actualizar fecha
                const ultimoRegistroFecha = document.getElementById('ultimo-registro-fecha');
                if (ultimoRegistroFecha) {
                    ultimoRegistroFecha.textContent = fechaFormateada;
                }
                
                // Generar grid de series
                const ultimoRegistroSeries = document.getElementById('ultimo-registro-series');
                if (ultimoRegistroSeries) {
                    const seriesHTML = [];
                    for (let i = 0; i < 4; i++) {
                        const serie = series[i];
                        if (serie && serie.peso && serie.repeticiones) {
                            seriesHTML.push(`
                                <div class="last-record-serie-item">
                                    <span class="last-record-serie-label">S${i + 1}</span>
                                    <span class="last-record-serie-value">${serie.peso}kg × ${serie.repeticiones}</span>
                                </div>
                            `);
                        } else {
                            seriesHTML.push(`
                                <div class="last-record-serie-item last-record-serie-empty">
                                    <span class="last-record-serie-label">S${i + 1}</span>
                                    <span class="last-record-serie-value">-</span>
                                </div>
                            `);
                        }
                    }
                    ultimoRegistroSeries.innerHTML = seriesHTML.join('');
                }
                
                // Pre-llenar los inputs con los valores del último registro
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
            } else {
                // No hay registro anterior, ocultar el contenedor
                ultimoRegistroInfo.style.display = 'none';
                
                // Limpiar los inputs
                for (let i = 1; i <= 4; i++) {
                    const pesoInput = form.querySelector(`#peso-serie-${i}`);
                    const repInput = form.querySelector(`#rep-serie-${i}`);
                    if (pesoInput) pesoInput.value = '';
                    if (repInput) repInput.value = '';
                }
            }
        } catch (error) {
            // En caso de error, ocultar el contenedor
            if (ultimoRegistroInfo) {
                ultimoRegistroInfo.style.display = 'none';
            }
        }
    } else {
        // Si no tenemos los IDs, ocultar el contenedor
        if (ultimoRegistroInfo) {
            ultimoRegistroInfo.style.display = 'none';
        }
    }
    
    // Ocultar botones flotantes cuando se muestra el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
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
    
    // Mostrar botones flotantes cuando se oculta el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'flex';
    });
        if (fechaInput) {
            // Función auxiliar para obtener fecha local
            const obtenerFechaLocal = () => {
                const ahora = new Date();
                const year = ahora.getFullYear();
                const month = String(ahora.getMonth() + 1).padStart(2, '0');
                const day = String(ahora.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            fechaInput.value = obtenerFechaLocal();
        }
        
        // Restaurar el texto del botón a "Guardar"
        const btnSubmit = formRegistro.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = 'Guardar';
        }
    }
}

// Función para mostrar modal de confirmación
export function showConfirmationModal(title, message, confirmText = 'Sí, Eliminar') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const btnYes = document.getElementById('modal-btn-yes');
        const btnNo = document.getElementById('modal-btn-no');
        
        if (!modal || !modalTitle || !modalMessage || !btnYes || !btnNo) {
            resolve(false);
            return;
        }
        
        // Establecer título y mensaje
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Mostrar ambos botones
        btnYes.style.display = 'block';
        btnNo.style.display = 'block';
        btnYes.textContent = confirmText;
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
// Función para obtener valores del formulario
export function obtenerValoresFormulario() {
    actualizarReferenciasDOM();
    return {
        nombre: inputNombreEjercicio ? inputNombreEjercicio.value.trim() : '',
        archivoImagen: inputImagenEjercicio ? inputImagenEjercicio.files[0] : null
    };
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
export function actualizarBreadcrumbs(links, onNavigate, container = null) {
    // Si se proporciona un contenedor, usarlo; si no, buscar en la vista activa o en todo el documento
    let breadcrumbsContainer = container;
    
    if (!breadcrumbsContainer) {
        // Buscar primero en la vista activa
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            breadcrumbsContainer = activeView.querySelector('#breadcrumbs');
        }
        
        // Si no se encuentra, buscar en todo el documento
        if (!breadcrumbsContainer) {
            breadcrumbsContainer = document.getElementById('breadcrumbs');
        }
    }
    
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

// Función para renderizar la tabla de historial
export function renderizarTablaHistorial(historial, paginaActual = 1, totalPaginas = 1) {
    if (!historial || historial.length === 0) {
        return `
            <div class="historial-empty">
                <p>No hay registros de mediciones aún.</p>
                <p class="historial-empty-hint">Usa el botón "Registrar Medición" para comenzar.</p>
            </div>
        `;
    }
    
    // El historial ya viene ordenado y paginado desde main.js
    const tarjetas = historial.map(medicion => {
        // Usar función auxiliar para formatear fecha sin problemas de timezone
        const fechaFormateada = formatearFechaVisual(medicion.fecha);
        
        return `
            <div class="historial-card" data-id="${medicion.id}">
                <div class="historial-card-header">
                    <div class="historial-card-fecha">${fechaFormateada}</div>
                    <div class="historial-card-peso">${medicion.peso ? `${medicion.peso} kg` : 'N/A'}</div>
                    <div class="historial-card-arrow">▼</div>
                </div>
                <div class="historial-card-details">
                    <div class="historial-detail-item">
                        <span class="historial-detail-label">Grasa:</span>
                        <span class="historial-detail-value">${medicion.grasa ? `${medicion.grasa}%` : '<span class="na">N/A</span>'}</span>
                    </div>
                    <div class="historial-detail-item">
                        <span class="historial-detail-label">Músculo:</span>
                        <span class="historial-detail-value">${medicion.musculo ? `${medicion.musculo}%` : '<span class="na">N/A</span>'}</span>
                    </div>
                    <div class="historial-detail-item">
                        <span class="historial-detail-label">Agua:</span>
                        <span class="historial-detail-value">${medicion.agua ? `${medicion.agua}%` : '<span class="na">N/A</span>'}</span>
                    </div>
                    <div class="historial-detail-item">
                        <span class="historial-detail-label">Visceral:</span>
                        <span class="historial-detail-value">${medicion.visceral ? `${medicion.visceral}` : '<span class="na">N/A</span>'}</span>
                    </div>
                    <div class="historial-card-actions">
                        <button class="btn-icon btn-editar-medicion" data-id="${medicion.id}" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon btn-eliminar-medicion" data-id="${medicion.id}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Controles de paginación (solo si hay más de una página)
    const controlesPaginacion = totalPaginas > 1
        ? `
            <div class="pagination-controls">
                <button id="btn-prev-page" class="btn-icon-small" ${paginaActual === 1 ? 'disabled' : ''}>❮</button>
                <span class="pagination-info">Página ${paginaActual} de ${totalPaginas}</span>
                <button id="btn-next-page" class="btn-icon-small" ${paginaActual === totalPaginas ? 'disabled' : ''}>❯</button>
            </div>
        `
        : '';
    
    // Devolver solo el contenido de la lista y los controles (el título ya existe en el contenedor)
    return `
        <div class="historial-list">
            ${tarjetas}
        </div>
        ${controlesPaginacion}
    `;
}

// Función auxiliar para renderizar las métricas
function renderizarMetricas(datosPerfil, ultimaMedicion, imc) {
    // Definir el orden y las métricas a mostrar
    const metricasOrden = [
        { key: 'peso', valor: ultimaMedicion?.peso || datosPerfil.peso },
        { key: 'imc', valor: imc?.valor },
        { key: 'grasa', valor: ultimaMedicion?.grasa },
        { key: 'musculo', valor: ultimaMedicion?.musculo },
        { key: 'agua', valor: ultimaMedicion?.agua },
        { key: 'visceral', valor: ultimaMedicion?.visceral }
    ];
    
    return metricasOrden.map(({ key, valor }) => {
        const config = METRICAS_CONFIG[key];
        if (!config) return '';
        
        const tieneValor = valor !== null && valor !== undefined;
        const rango = obtenerRangoMetrica(key, valor);
        const valorFormateado = tieneValor ? valor : null;
        const unidad = config.unit ? ` ${config.unit}` : '';
        
        return `
            <div class="metric-item">
                <div class="metric-label">${config.label}</div>
                <div class="metric-value">${valorFormateado !== null ? `${valorFormateado}${unidad}` : '--'}</div>
                ${rango ? `<div class="metric-badge" style="color: ${rango.color};">${rango.label}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Función para renderizar la vista de perfil
export function renderizarPerfilView(datosPerfil = {}, perfilActual = null) {
    actualizarReferenciasDOM();
    
    const perfilView = document.getElementById('perfil-view');
    if (!perfilView) {
        return;
    }
    
    const nombre = datosPerfil.nombre || 'Usuario';
    const peso = datosPerfil.peso || null;
    const altura = datosPerfil.altura || null;
    const edad = datosPerfil.edad || null;
    const imc = datosPerfil.imc || { valor: null, categoria: 'No disponible' };
    const ultimaMedicion = datosPerfil.ultimaMedicion || null;
    
    // URL de la foto de perfil: usar datosPerfil.foto si existe, sino usar el avatar del perfil actual, sino fallback
    const fotoPerfil = datosPerfil.foto || (perfilActual ? perfilActual.avatar : 'images/favicon.png');
    
    const perfilHTML = `
        <div class="perfil-header">
            <img src="${fotoPerfil}" alt="${nombre}" class="perfil-foto" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Ccircle cx=%2760%27 cy=%2760%27 r=%2760%27 fill=%27%231C1C1E%27/%3E%3Ctext x=%2760%27 y=%2770%27 text-anchor=%27middle%27 fill=%27white%27 font-size=%2740%27%3E${nombre.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E'">
            <h2 class="perfil-nombre">${nombre}</h2>
        </div>
        
        <div class="perfil-stats-grid" data-nombre="${nombre}" data-peso="${peso || ''}" data-altura="${altura || ''}" data-edad="${edad || ''}">
            <div class="stat-card">
                <div class="stat-label">PESO</div>
                <div class="stat-value">${peso ? `${peso} kg` : '--'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">ALTURA</div>
                <div class="stat-value">${altura ? `${altura} cm` : '--'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">EDAD</div>
                <div class="stat-value">${edad ? `${edad} años` : '--'}</div>
            </div>
            <div class="stat-card stat-card-imc">
                <div class="stat-label">IMC</div>
                <div class="stat-value">${imc.valor ? imc.valor : '--'}</div>
                <div class="stat-categoria">${imc.categoria}</div>
            </div>
        </div>
        
        <div class="perfil-resumen-section">
            <h3 class="section-title-perfil">RESUMEN ACTUAL</h3>
            <div class="perfil-metricas-list">
                ${renderizarMetricas(datosPerfil, ultimaMedicion, imc)}
            </div>
        </div>
        
        <div class="chart-wrapper">
            <div class="chart-controls">
                <button class="chart-filter-btn active" data-filter="peso">Peso</button>
                <button class="chart-filter-btn" data-filter="grasa">Grasa</button>
                <button class="chart-filter-btn" data-filter="musculo">Músculo</button>
            </div>
            <div class="chart-container">
                <canvas id="progressChart"></canvas>
            </div>
        </div>
        
        ${renderizarTablaHistorial(datosPerfil.historial || [])}
        
        <button id="btn-borrar-historial" class="btn btn-borrar-historial">Borrar Historial (Dev)</button>
        
        <button id="btn-editar-perfil" class="btn btn-editar-perfil">Editar Perfil</button>
        <button id="btn-registrar-medicion" class="btn btn-registrar-medicion">Registrar Medición</button>
        
        <div style="margin-top: 30px; margin-bottom: 20px; border-top: 1px solid #333; padding-top: 20px;">
            <button id="btn-cerrar-sesion" class="btn btn-secondary" style="width: 100%; border-color: #ff4444; color: #ff4444;">
                Cerrar Sesión / Cambiar Perfil
            </button>
        </div>
        
        <!-- Modal de edición de perfil -->
        <div id="modal-perfil" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Editar Perfil</h3>
                <form id="form-perfil">
                    <div class="form-group">
                        <label for="nombre-perfil">Nombre</label>
                        <input type="text" id="nombre-perfil" name="nombre" required>
                    </div>
                    <div class="form-group">
                        <label for="peso-perfil">Peso (kg)</label>
                        <input type="number" id="peso-perfil" name="peso" min="1" max="500" step="any">
                    </div>
                    <div class="form-group">
                        <label for="altura-perfil">Altura (cm)</label>
                        <input type="number" id="altura-perfil" name="altura" min="1" max="300" step="any">
                    </div>
                    <div class="form-group">
                        <label for="edad-perfil">Edad</label>
                        <input type="number" id="edad-perfil" name="edad" min="1" max="150" step="any">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-perfil" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal de registro de medición -->
        <div id="modal-medicion" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Registrar Medición</h3>
                <form id="form-medicion">
                    <div class="form-group">
                        <label for="fecha-medicion">Fecha</label>
                        <input type="date" id="fecha-medicion" name="fecha" required>
                    </div>
                    <div class="form-group">
                        <label for="peso-medicion">Peso (kg)</label>
                        <input type="number" id="peso-medicion" name="peso" min="1" max="500" step="any" required>
                    </div>
                    <div class="form-group">
                        <label for="grasa-medicion">Grasa (%)</label>
                        <input type="number" id="grasa-medicion" name="grasa" min="0" max="100" step="any">
                    </div>
                    <div class="form-group">
                        <label for="musculo-medicion">Músculo (%)</label>
                        <input type="number" id="musculo-medicion" name="musculo" min="0" max="100" step="any">
                    </div>
                    <div class="form-group">
                        <label for="agua-medicion">Agua (%)</label>
                        <input type="number" id="agua-medicion" name="agua" min="0" max="100" step="any">
                    </div>
                    <div class="form-group">
                        <label for="visceral-medicion">Visceral (Nivel)</label>
                        <input type="number" id="visceral-medicion" name="visceral" min="0" max="50" step="any">
                    </div>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cancelar-medicion" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    perfilView.innerHTML = perfilHTML;
    
    // Guardar datos en un elemento oculto para el modal
    const statsGrid = perfilView.querySelector('.perfil-stats-grid');
    if (statsGrid) {
        statsGrid.classList.add('perfil-data');
    }
}

// Función para renderizar el modal de selección de ejercicios
export function renderizarModalSeleccionEjercicio(ejerciciosPorCategoria) {
    const modal = document.getElementById('modal-seleccion-ejercicio');
    if (!modal) {
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

// Función para renderizar la vista de calendario
export function renderizarCalendarioView(diasEntrenados = [], racha = 0, fechaReferencia = null) {
    const calendarioView = document.getElementById('calendario-view');
    if (!calendarioView) {
        return;
    }
    
    // Convertir array de objetos a Map para búsqueda rápida por fecha
    const diasMap = new Map();
    diasEntrenados.forEach(dia => {
        const fecha = typeof dia === 'string' ? dia : dia.fecha;
        diasMap.set(fecha, typeof dia === 'string' ? null : dia);
    });
    
    // Usar fechaReferencia o fecha actual por defecto
    const fechaBase = fechaReferencia || new Date();
    const añoActual = fechaBase.getFullYear();
    const mesActual = fechaBase.getMonth(); // 0-11
    
    // Obtener fecha actual real para comparaciones
    const hoy = new Date();
    const añoHoy = hoy.getFullYear();
    const mesHoy = hoy.getMonth();
    const diaHoy = hoy.getDate();
    
    // Obtener primer día del mes y último día
    const primerDia = new Date(añoActual, mesActual, 1);
    const ultimoDia = new Date(añoActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemanaInicio = primerDia.getDay(); // 0 (domingo) - 6 (sábado)
    
    // Nombres de meses y días
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Calcular estadísticas del mes
    let diasPerfectos = 0; // Días verdes (cantidad === total)
    let diasParciales = 0; // Días amarillos/naranjas (cantidad > 0 pero cantidad < total)
    const entrenosPorNombre = new Map();
    
    // Generar grid de días
    let gridHTML = '<div class="calendar-grid">';
    
    // Encabezados de días de la semana
    nombresDias.forEach(dia => {
        gridHTML += `<div class="calendar-day-header">${dia}</div>`;
    });
    
    // Días vacíos al inicio del mes
    for (let i = 0; i < diaSemanaInicio; i++) {
        gridHTML += '<div class="calendar-day empty"></div>';
    }
    
    // Calcular fecha de hoy real para comparar (no la fecha de referencia)
    const fechaHoyString = `${añoHoy}-${String(mesHoy + 1).padStart(2, '0')}-${String(diaHoy).padStart(2, '0')}`;
    let diasFalladosMes = 0;
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaString = `${añoActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const fechaDia = new Date(fechaString + 'T12:00:00');
        const fechaHoy = new Date(fechaHoyString + 'T12:00:00');
        const esFuturo = fechaDia > fechaHoy;
        const esHoy = (dia === diaHoy && mesActual === mesHoy && añoActual === añoHoy);
        const esPasado = fechaDia < fechaHoy;
        const datosDia = diasMap.get(fechaString);
        
        let clases = 'calendar-day';
        let cantidadCompletada = 0;
        let totalEjercicios = 0;
        let entrenoNombre = '';
        let esRojo = false;
        
        // Aplicar reglas de estado según las especificaciones
        if (esFuturo) {
            // Futuro: Sin color (default)
            clases += '';
        } else if (!datosDia && (esPasado || esHoy)) {
            // Rojo (Ausente): Fecha <= hoy Y NO existe registro
            clases += ' day-red';
            esRojo = true;
            if (esPasado) {
                diasFalladosMes++;
            }
        } else if (datosDia) {
            cantidadCompletada = datosDia.cantidadCompletada || 0;
            totalEjercicios = datosDia.totalEjercicios || 0;
            entrenoNombre = datosDia.entrenoNombre || 'Entreno';
            
            // Aplicar clases según las reglas de estado
            if (cantidadCompletada > 0 && cantidadCompletada < 3) {
                clases += ' day-orange'; // Naranja (Incompleto)
                diasParciales++;
            } else if (cantidadCompletada >= 3 && cantidadCompletada < totalEjercicios) {
                clases += ' day-yellow'; // Amarillo (Cumplido)
                diasParciales++;
            } else if (cantidadCompletada === totalEjercicios && totalEjercicios > 0) {
                clases += ' day-green'; // Verde (Perfecto)
                diasPerfectos++;
            }
            
            // Contar entrenos por nombre
            if (entrenoNombre) {
                entrenosPorNombre.set(entrenoNombre, (entrenosPorNombre.get(entrenoNombre) || 0) + 1);
            }
        }
        
        if (esHoy) {
            clases += ' today';
        }
        
        // Añadir atributos de datos para la interacción
        const dataAttrs = datosDia 
            ? `data-cantidad="${cantidadCompletada}" data-total="${totalEjercicios}" data-entreno="${entrenoNombre}"`
            : esRojo ? 'data-rojo="true"' : '';
        
        gridHTML += `<div class="${clases}" data-fecha="${fechaString}" ${dataAttrs}>${dia}</div>`;
    }
    
    gridHTML += '</div>';
    
    // Calcular total de asistencias
    const totalAsistencias = diasPerfectos + diasParciales;
    
    // Generar HTML de estadísticas mensuales
    let estadisticasHTML = '<div class="calendario-estadisticas">';
    estadisticasHTML += '<h3 class="estadisticas-title">Resumen del Mes</h3>';
    estadisticasHTML += '<div class="estadisticas-grid">';
    
    estadisticasHTML += `
        <div class="stat-card-mes">
            <div class="stat-label-mes">Entrenamientos Totales</div>
            <div class="stat-value-mes">${totalAsistencias}</div>
        </div>
        <div class="stat-card-mes">
            <div class="stat-label-mes">Días Perfectos</div>
            <div class="stat-value-mes">${diasPerfectos}</div>
        </div>
        <div class="stat-card-mes stat-card-parciales">
            <div class="stat-label-mes">Días Parciales</div>
            <div class="stat-value-mes">${diasParciales}</div>
        </div>
        <div class="stat-card-mes stat-card-fallados">
            <div class="stat-label-mes">Días de Descanso</div>
            <div class="stat-value-mes">${diasFalladosMes}</div>
        </div>
    `;
    
    estadisticasHTML += '</div>';
    
    // Desglose por entreno (Frecuencia) - Grid de tarjetas estilo ANTERIOR
    estadisticasHTML += '<div class="entrenos-desglose">';
    estadisticasHTML += '<h4 class="desglose-title">Frecuencia por Entreno</h4>';
    estadisticasHTML += '<div class="frecuencia-grid">';
    
    // Definir los 4 entrenos principales en orden
    const entrenosPrincipales = ['Push', 'Pull', 'Piernas', 'Gluteos'];
    
    entrenosPrincipales.forEach(nombre => {
        const cantidad = entrenosPorNombre.get(nombre) || 0;
        const tieneDatos = cantidad > 0;
        
        estadisticasHTML += `
            <div class="frecuencia-card ${!tieneDatos ? 'frecuencia-card-empty' : ''}">
                <div class="frecuencia-card-label">${nombre}</div>
                <div class="frecuencia-card-value">${cantidad}</div>
            </div>
        `;
    });
    
    estadisticasHTML += '</div>';
    estadisticasHTML += '</div>';
    
    estadisticasHTML += '</div>';
    
    // Modal para mostrar detalle del día
    const modalHTML = `
        <div id="modal-detalle-dia" class="modal-detalle-dia">
            <div class="modal-detalle-dia-content">
                <button class="modal-detalle-dia-close" id="btn-cerrar-detalle-dia">&times;</button>
                <div id="detalle-dia-contenido">
                    <!-- Se llenará dinámicamente -->
                </div>
            </div>
        </div>
    `;
    
    const calendarioHTML = `
        <div class="calendario-container">
            <h2 class="calendario-title">CALENDARIO</h2>
            
            <div class="racha-card">
                <div class="racha-icon ${racha > 0 ? 'fire-active' : ''}">🔥</div>
                <div class="racha-content">
                    <div class="racha-label">Racha Actual</div>
                    <div class="racha-value">${racha} Semana${racha !== 1 ? 's' : ''}</div>
                    <div class="racha-subtitle">Meta: 4 días/semana</div>
                </div>
            </div>
            
            <div class="calendario-mes-header">
                <button id="btn-prev-month" class="btn-icon-small" aria-label="Mes anterior">❮</button>
                <h3>${nombresMeses[mesActual]} ${añoActual}</h3>
                <button id="btn-next-month" class="btn-icon-small" aria-label="Mes siguiente">❯</button>
            </div>
            
            ${gridHTML}
            
            ${estadisticasHTML}
            
            ${modalHTML}
        </div>
    `;
    
    calendarioView.innerHTML = calendarioHTML;
    
    // Configurar event listeners para los días
    const calendarDays = calendarioView.querySelectorAll('.calendar-day[data-fecha]');
    const modalDetalle = calendarioView.querySelector('#modal-detalle-dia');
    const contenidoDetalle = calendarioView.querySelector('#detalle-dia-contenido');
    const btnCerrarDetalle = calendarioView.querySelector('#btn-cerrar-detalle-dia');
    
    // Función para abrir el modal
    function abrirModalDetalle(fecha, cantidad, total, entreno, esRojo) {
        if (!modalDetalle || !contenidoDetalle) return;
        
        const fechaFormateada = formatearFechaCorta(fecha);
        let contenidoHTML = '';
        
        if (esRojo) {
            // Día rojo: Día de descanso
            contenidoHTML = `
                <div class="detalle-dia-header">
                    <h2 class="detalle-dia-fecha">${fechaFormateada}</h2>
                </div>
                <div class="detalle-dia-body">
                    <div class="detalle-dia-mensaje">
                        <div class="detalle-dia-icono">😴</div>
                        <p class="detalle-dia-texto">Día de Descanso</p>
                    </div>
                </div>
            `;
        } else if (cantidad && total && entreno) {
            // Día con datos: mostrar información completa
            let estado = '';
            let estadoColor = '';
            let estadoTexto = '';
            
            if (cantidad > 0 && cantidad < 3) {
                estado = 'incompleto';
                estadoColor = '#ff8800';
                estadoTexto = 'Incompleto';
            } else if (cantidad >= 3 && cantidad < total) {
                estado = 'parcial';
                estadoColor = '#ffcc00';
                estadoTexto = 'Parcial';
            } else if (cantidad === total && total > 0) {
                estado = 'completado';
                estadoColor = '#dfff00';
                estadoTexto = 'Completado';
            }
            
            contenidoHTML = `
                <div class="detalle-dia-header">
                    <h2 class="detalle-dia-fecha">${fechaFormateada}</h2>
                </div>
                <div class="detalle-dia-body">
                    <div class="detalle-dia-entreno">
                        <span class="detalle-dia-label">Entreno:</span>
                        <span class="detalle-dia-valor">${entreno}</span>
                    </div>
                    <div class="detalle-dia-estado" style="border-color: ${estadoColor}; background-color: ${estadoColor}20;">
                        <span class="detalle-dia-estado-badge" style="color: ${estadoColor};">${estadoTexto}</span>
                    </div>
                    <div class="detalle-dia-detalle">
                        <span class="detalle-dia-label">Detalle:</span>
                        <span class="detalle-dia-valor">${cantidad} de ${total} ejercicios completados</span>
                    </div>
                </div>
            `;
        } else {
            // Día futuro sin datos
            return;
        }
        
        contenidoDetalle.innerHTML = contenidoHTML;
        modalDetalle.style.display = 'flex';
    }
    
    // Función para cerrar el modal
    function cerrarModalDetalle() {
        if (modalDetalle) {
            modalDetalle.style.display = 'none';
        }
    }
    
    // Event listeners
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            const fecha = this.dataset.fecha;
            const cantidad = this.dataset.cantidad;
            const total = this.dataset.total;
            const entreno = this.dataset.entreno;
            const esRojo = this.dataset.rojo === 'true';
            
            abrirModalDetalle(fecha, cantidad, total, entreno, esRojo);
        });
    });
    
    // Cerrar modal al hacer clic en el botón de cerrar
    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', cerrarModalDetalle);
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    if (modalDetalle) {
        modalDetalle.addEventListener('click', function(e) {
            if (e.target === modalDetalle) {
                cerrarModalDetalle();
            }
        });
    }
}

// Función para obtener la vista de calendario
export function getCalendarioView() {
    return document.getElementById('calendario-view');
}

