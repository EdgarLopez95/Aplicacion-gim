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
    obtenerTodosLosEjerciciosDeBiblioteca,
    sustituirEjercicioEnEntreno,
    toggleCompletadoEjercicio,
    obtenerFechaLocal,
    guardarPerfil,
    obtenerPerfil,
    guardarMedicion,
    obtenerHistorialCorporal,
    borrarTodoHistorialCorporal,
    actualizarMedicion,
    eliminarMedicion,
    obtenerDiasEntrenados,
    actualizarNombreEntreno
} from './storage.js';

import {
    showView,
    renderizarDashboardView,
    renderizarEntrenoView,
    renderizarListaEjercicios,
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
    renderizarModalSeleccionEjercicio,
    renderizarCalendarioView,
    getCalendarioView,
    renderizarTablaHistorial,
    formatearFechaVisual,
    aplicarTema
} from './ui.js';

import {
    obtenerUsuarioActual,
    setUsuarioActual,
    cerrarSesion,
    obtenerPerfilActual,
    PERFILES
} from './userSession.js';

/**
 * Convierte un color hexadecimal a rgba con transparencia
 * @param {string} hex - Color hexadecimal (ej: '#dfff00')
 * @param {number} alpha - Valor de transparencia (0-1)
 * @returns {string} Color en formato rgba
 */
function hexToRgba(hex, alpha = 1) {
    // Remover el # si existe
    hex = hex.replace('#', '');
    
    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Referencia al botón cancelar (está en el HTML del modal)
let btnCancelarEjercicio = null;

// Variable global para la fecha del calendario
let fechaCalendario = new Date();

// Variables de estado
let entrenoActual = null;
let ejercicioActual = null;
let currentlyEditingId = null;
let ejercicioSustituyendo = null;
let currentlyEditingRegistroId = null;
let currentlyEditingCategoriaId = null;
let currentlyEditingEjercicioCategoriaId = null;
let categoriaActual = null;

// Variables de paginación para la vista de ejercicio
let paginaActualEjercicio = 1;
const REGISTROS_POR_PAGINA_EJERCICIO = 4;
let registrosEjercicioGlobal = []; // Para guardar la copia completa

// Función auxiliar para manejar el clic en el botón "Añadir Ejercicio"
async function manejarClicAnadirEjercicio() {
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
        
        // Paso 3: Actualizar modal con los datos reales (siempre se ejecuta, incluso si está vacío)
        renderizarModalSeleccionEjercicio(ejerciciosPorCategoria);
        
        // Si no hay ejercicios, mostrar mensaje
        if (!ejerciciosPorCategoria || ejerciciosPorCategoria.length === 0) {
            const modalContent = modalSeleccion?.querySelector('.modal-content');
            if (modalContent) {
                const existingContent = modalContent.innerHTML;
                // Añadir mensaje si no hay ejercicios
                if (!existingContent.includes('No se encontraron ejercicios')) {
                    modalContent.innerHTML = `
                        <h3>SELECCIONAR EJERCICIO</h3>
                        <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                            No se encontraron ejercicios en la biblioteca.
                        </p>
                        <div class="modal-buttons">
                            <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                        </div>
                    `;
                    // Reconfigurar el listener del botón cerrar
                    const btnCerrar = document.getElementById('btn-cerrar-seleccion');
                    if (btnCerrar) {
                        btnCerrar.addEventListener('click', function() {
                            modalSeleccion.style.display = 'none';
                        });
                    }
                }
            }
        } else {
            // Configurar listeners del modal de selección solo si hay ejercicios
            configurarEventListenersModalSeleccion();
        }
    } catch (error) {
        // Este catch nunca debería ejecutarse ahora (la función siempre devuelve array)
        // Pero lo mantenemos por seguridad
        
        // Mostrar mensaje en el modal
        const modalContent = modalSeleccion?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <h3>SELECCIONAR EJERCICIO</h3>
                <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    No se encontraron ejercicios en la biblioteca.
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
}

// Función para configurar event listeners de la vista de entreno
function configurarEventListenersEntrenoView() {
    btnCancelarEjercicio = document.getElementById('btn-cancelar-ejercicio');
    const formNuevoEjercicio = getFormNuevoEjercicio();
    const modalNuevoEjercicio = getModalNuevoEjercicio();
    
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
                
                // Actualizar barra de progreso
                actualizarBarraProgreso();
            } catch (error) {
                alert('Error al agregar el ejercicio al entreno');
            }
        });
    });
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
        }
        
        // 3. RENDERIZAR LOS EJERCICIOS (LO MÁS IMPORTANTE)
        const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
        renderizarListaEjercicios(ejercicios, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio);
        
        // Actualizar barra de progreso
        actualizarBarraProgreso();
        
        // Resetear el ID de edición
        currentlyEditingId = null;
        
        // 4. CERRAR EL MODAL
        ocultarModal();
        
    } catch (error) {
        // 3. Manejar el error
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
        
        // 4. Actualizar barra de progreso
        actualizarBarraProgreso();
        
    } catch (error) {
        // Si falla, reemplaza el spinner con un error
        const listaContainer = document.getElementById('lista-ejercicios-container');
        if (listaContainer) {
            listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error al cargar ejercicios.</p>';
        }
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
    }
}

// Función auxiliar para calcular el IMC
function calcularIMC(peso, altura) {
    if (!peso || !altura || peso <= 0 || altura <= 0) {
        return { valor: null, categoria: 'No disponible' };
    }
    
    // Convertir altura de cm a metros
    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    const imcRedondeado = Math.round(imc * 10) / 10;
    
    // Determinar categoría según OMS
    let categoria;
    if (imc < 18.5) {
        categoria = 'Bajo peso';
    } else if (imc < 25) {
        categoria = 'Peso normal';
    } else if (imc < 30) {
        categoria = 'Sobrepeso';
    } else {
        categoria = 'Obesidad';
    }
    
    return { valor: imcRedondeado, categoria };
}

// Variable global para la gráfica
let progressChart = null;
let historialCorporalGlobal = null; // Guardar historial para filtros
let filtroGraficaActual = 'peso'; // Filtro activo por defecto
let medicionEditandoId = null; // ID de la medición que se está editando

// Función para mostrar la vista de perfil
async function mostrarVistaPerfil() {
    try {
        // 1. Cargar datos del perfil
        const datosPerfil = await obtenerPerfil();
        
        // 2. Calcular IMC
        const imc = calcularIMC(datosPerfil.peso, datosPerfil.altura);
        
        // 3. Obtener historial corporal
        const historial = await obtenerHistorialCorporal();
        historialCorporalGlobal = historial;
        
        // 4. Obtener último registro para el resumen
        const ultimaMedicion = historial.length > 0 ? historial[historial.length - 1] : null;
        
        // 5. Obtener perfil actual para el avatar
        const perfilActual = obtenerPerfilActual();
        
        // 6. Renderizar la vista con historial completo
        renderizarPerfilView({ 
            ...datosPerfil, 
            imc,
            ultimaMedicion,
            historial
        }, perfilActual);
        
        // 6. Mostrar la vista
        showView(document.getElementById('perfil-view'));
        
        // 7. Configurar event listeners
        configurarEventListenersPerfil();
        
        // 8. Renderizar gráfica con filtro actual
        try {
            renderizarGraficaComposicion(historial, filtroGraficaActual);
        } catch (e) {
            // Error no bloqueante en gráfica
        }
        
    } catch (error) {
        // Obtener perfil actual para el avatar incluso en caso de error
        const perfilActual = obtenerPerfilActual();
        
        // Renderizar vista vacía en caso de error
        renderizarPerfilView({ 
            nombre: '', 
            peso: null, 
            altura: null, 
            edad: null, 
            imc: { valor: null, categoria: 'No disponible' },
            ultimaMedicion: null,
            historial: []
        }, perfilActual);
        showView(document.getElementById('perfil-view'));
        configurarEventListenersPerfil();
        historialCorporalGlobal = [];
    }
}

// Función para mostrar la vista de calendario
async function mostrarVistaCalendario() {
    try {
        // Si es la primera vez que se abre, resetear a la fecha actual
        if (!fechaCalendario || fechaCalendario.toString() === 'Invalid Date') {
            fechaCalendario = new Date();
        }
        
        // 1. Obtener días entrenados
        const diasEntrenados = await obtenerDiasEntrenados();
        
        // 2. Calcular racha semanal
        const racha = calcularRachaSemanal(diasEntrenados);
        
        // 3. Renderizar la vista con la fecha de referencia
        renderizarCalendarioView(diasEntrenados, racha, fechaCalendario);
        
        // 4. Configurar listeners de navegación
        configurarNavegacionCalendario(diasEntrenados, racha);
        
        // 5. Mostrar la vista
        showView(getCalendarioView());
    } catch (error) {
        alert('Error al cargar el calendario. Por favor, intenta de nuevo.');
    }
}

// Función para configurar la navegación del calendario
async function configurarNavegacionCalendario(diasEntrenados, racha) {
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    
    if (btnPrevMonth) {
        btnPrevMonth.addEventListener('click', async () => {
            fechaCalendario.setMonth(fechaCalendario.getMonth() - 1);
            // Crear nueva instancia para evitar problemas de referencia
            fechaCalendario = new Date(fechaCalendario);
            renderizarCalendarioView(diasEntrenados, racha, fechaCalendario);
            configurarNavegacionCalendario(diasEntrenados, racha);
        });
    }
    
    if (btnNextMonth) {
        btnNextMonth.addEventListener('click', async () => {
            fechaCalendario.setMonth(fechaCalendario.getMonth() + 1);
            // Crear nueva instancia para evitar problemas de referencia
            fechaCalendario = new Date(fechaCalendario);
            renderizarCalendarioView(diasEntrenados, racha, fechaCalendario);
            configurarNavegacionCalendario(diasEntrenados, racha);
        });
    }
}

// Función para renderizar la gráfica de composición corporal
function renderizarGraficaComposicion(historial, filtro = 'peso') {
    const canvas = document.getElementById('progressChart');
    if (!canvas) {
        return;
    }
    
    // Destruir gráfica anterior si existe
    if (progressChart) {
        progressChart.destroy();
        progressChart = null;
    }
    
    // Si no hay datos, mostrar gráfica vacía
    if (!historial || historial.length === 0) {
        const ctx = canvas.getContext('2d');
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#FFFFFF'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: '#333' }
                    },
                    y: {
                        ticks: { color: '#b0b0b0' },
                        grid: { color: '#333' },
                        beginAtZero: true
                    }
                }
            }
        });
        return;
    }
    
    // Preparar datos según el filtro
    const { labels, datasets, yAxisConfig } = prepararDatosGrafica(historial, filtro);
    
    const ctx = canvas.getContext('2d');
    progressChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#FFFFFF',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#333',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: '#b0b0b0',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { 
                        color: '#333'
                    }
                },
                    y: {
                        ticks: { 
                            color: '#b0b0b0'
                        },
                        grid: { 
                            color: '#333'
                        },
                        beginAtZero: false, // No forzar comenzar en cero para mejor visualización
                        ...yAxisConfig
                    }
            }
        }
    });
}

// Función para preparar datos según el filtro
function prepararDatosGrafica(historial, filtro) {
    // Obtener el color del tema actual desde el CSS
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    // Crear una versión con transparencia para el fondo
    const themeColorAlpha = themeColor.startsWith('#') ? hexToRgba(themeColor, 0.1) : themeColor;
    
    // Formatear fechas de forma simple y consistente
    const fechas = historial.map(m => {
        try {
            const fecha = new Date(m.fecha);
            // Verificar que la fecha sea válida
            if (isNaN(fecha.getTime())) {
                return '';
            }
            // Formato simple: DD/MM
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            return `${dia}/${mes}`;
        } catch (error) {
            return '';
        }
    });
    
    let datasets = [];
    let yAxisConfig = {};
    
    switch (filtro) {
        case 'peso':
            const pesoData = historial.map(m => m.peso || null);
            datasets = [{
                label: 'Peso (kg)',
                data: pesoData,
                borderColor: themeColor,
                backgroundColor: themeColorAlpha,
                tension: 0.4,
                fill: false
            }];
            yAxisConfig = {
                suggestedMin: 60,
                suggestedMax: 85,
                title: {
                    display: true,
                    text: 'Peso (kg)',
                    color: '#b0b0b0'
                }
            };
            break;
            
        case 'grasa':
            const grasaData = historial.map(m => m.grasa || null);
            datasets = [{
                label: 'Grasa (%)',
                data: grasaData,
                borderColor: '#ff4444',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                tension: 0.4,
                fill: false
            }];
            yAxisConfig = {
                suggestedMin: 5,
                suggestedMax: 35,
                title: {
                    display: true,
                    text: 'Porcentaje (%)',
                    color: '#b0b0b0'
                }
            };
            break;
            
        case 'musculo':
            const musculoData = historial.map(m => m.musculo || null);
            datasets = [{
                label: 'Músculo (%)',
                data: musculoData,
                borderColor: '#44ff44',
                backgroundColor: 'rgba(68, 255, 68, 0.1)',
                tension: 0.4,
                fill: false
            }];
            yAxisConfig = {
                suggestedMin: 25,
                suggestedMax: 55,
                title: {
                    display: true,
                    text: 'Porcentaje (%)',
                    color: '#b0b0b0'
                }
            };
            break;
            
        default:
            datasets = [];
            yAxisConfig = {};
    }
    
    return { labels: fechas, datasets, yAxisConfig };
}

// Función para actualizar la gráfica con un nuevo filtro
function actualizarGraficaConFiltro(historial, filtro) {
    if (!progressChart) {
        // Si no existe la gráfica, crearla
        renderizarGraficaComposicion(historial, filtro);
        return;
    }
    
    const { labels, datasets, yAxisConfig } = prepararDatosGrafica(historial, filtro);
    
    // Actualizar labels y datasets
    progressChart.data.labels = labels;
    progressChart.data.datasets = datasets;
    
    // Actualizar eje Y con todas las opciones de escala
    if (progressChart.options.scales.y) {
        // Aplicar suggestedMin y suggestedMax
        if (yAxisConfig.suggestedMin !== undefined) {
            progressChart.options.scales.y.suggestedMin = yAxisConfig.suggestedMin;
        }
        if (yAxisConfig.suggestedMax !== undefined) {
            progressChart.options.scales.y.suggestedMax = yAxisConfig.suggestedMax;
        }
        // Limpiar min/max estrictos si existen
        delete progressChart.options.scales.y.min;
        delete progressChart.options.scales.y.max;
        // Actualizar título
        if (yAxisConfig.title) {
            progressChart.options.scales.y.title = yAxisConfig.title;
        }
    }
    
    // Actualizar la gráfica
    progressChart.update('none'); // 'none' para animación más rápida
}

// Función para configurar event listeners del perfil
function configurarEventListenersPerfil() {
    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const btnCancelarPerfil = document.getElementById('btn-cancelar-perfil');
    const formPerfil = document.getElementById('form-perfil');
    const btnRegistrarMedicion = document.getElementById('btn-registrar-medicion');
    const btnCancelarMedicion = document.getElementById('btn-cancelar-medicion');
    const formMedicion = document.getElementById('form-medicion');
    
    // Botón editar perfil
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', function() {
            mostrarModalPerfil();
        });
    }
    
    // Botón cancelar perfil
    if (btnCancelarPerfil) {
        btnCancelarPerfil.addEventListener('click', function() {
            ocultarModalPerfil();
        });
    }
    
    // Formulario guardar perfil
    if (formPerfil) {
        formPerfil.addEventListener('submit', async function(e) {
            e.preventDefault();
            await manejarGuardarPerfil();
        });
    }
    
    // Botón registrar medición
    if (btnRegistrarMedicion) {
        btnRegistrarMedicion.addEventListener('click', function() {
            mostrarModalMedicion();
        });
    }
    
    // Botón cancelar medición
    if (btnCancelarMedicion) {
        btnCancelarMedicion.addEventListener('click', function() {
            ocultarModalMedicion();
        });
    }
    
    // Formulario guardar medición
    if (formMedicion) {
        formMedicion.addEventListener('submit', async function(e) {
            e.preventDefault();
            await manejarGuardarMedicion();
        });
    }
    
    // Botones de filtro de gráfica
    const filterButtons = document.querySelectorAll('.chart-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filtro = this.dataset.filter;
            
            // Actualizar estado visual de botones
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Actualizar gráfica
            filtroGraficaActual = filtro;
            if (historialCorporalGlobal) {
                actualizarGraficaConFiltro(historialCorporalGlobal, filtro);
            }
        });
    });
    
    // Botón borrar historial
    const btnBorrarHistorial = document.getElementById('btn-borrar-historial');
    if (btnBorrarHistorial) {
        btnBorrarHistorial.addEventListener('click', async function() {
            const confirmar = confirm('¿Estás seguro de que quieres borrar TODO el historial corporal? Esta acción no se puede deshacer.');
            if (!confirmar) return;
            
            try {
                await borrarTodoHistorialCorporal();
                historialCorporalGlobal = [];
                // Recargar la vista
                await mostrarVistaPerfil();
                alert('Historial borrado correctamente');
            } catch (error) {
                alert('Error al borrar el historial. Por favor, intenta de nuevo.');
            }
        });
    }
    
    // Botón cerrar sesión / cambiar perfil
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', function() {
            if (confirm('¿Quieres cerrar sesión y cambiar de perfil?')) {
                cerrarSesion();
            }
        });
    }
    
    // Botón clonar de Edgar (temporal)
    const btnClonarEdgar = document.getElementById('btn-clonar-edgar');
    if (btnClonarEdgar) {
        btnClonarEdgar.addEventListener('click', async function() {
            const confirmar = confirm('⚠️ ¿Estás seguro de que quieres clonar la configuración de Edgar?\n\n' +
                'Esto copiará:\n' +
                '• Todas las categorías musculares y ejercicios de biblioteca\n' +
                '• Todos los entrenos y ejercicios (SIN historial de registros)\n\n' +
                '⚠️ Esto SOBREESCRIBIRÁ la configuración actual de Valentina.\n\n' +
                '¿Continuar?');
            if (!confirmar) return;
            
            // Deshabilitar el botón durante la clonación
            btnClonarEdgar.disabled = true;
            btnClonarEdgar.textContent = '🔄 Clonando...';
            
            try {
                // Importar y ejecutar la función de clonación
                const { clonarEdgarAValentina } = await import('./cloneProfile.js');
                await clonarEdgarAValentina();
                
                // El script recarga la página automáticamente
            } catch (error) {
                console.error('Error al clonar configuración:', error);
                alert('Error al clonar configuración:\n\n' + error.message);
                
                // Rehabilitar el botón en caso de error
                btnClonarEdgar.disabled = false;
                btnClonarEdgar.textContent = '👯 CLONAR DE EDGAR';
            }
        });
    }
    
    // Configurar event listeners de mediciones
    configurarEventListenersMediciones();
}

// Función para configurar event listeners de las tarjetas de mediciones
function configurarEventListenersMediciones() {
    // Tarjetas de historial expandibles
    const historialCards = document.querySelectorAll('.historial-card');
    historialCards.forEach(card => {
        // Click en la tarjeta para expandir/colapsar
        const cardHeader = card.querySelector('.historial-card-header');
        if (cardHeader) {
            cardHeader.addEventListener('click', function(e) {
                // No expandir si se hace clic en los botones de acción
                if (e.target.closest('.btn-icon')) {
                    return;
                }
                card.classList.toggle('expanded');
            });
        }
    });
    
    // Botones de editar medición
    const botonesEditar = document.querySelectorAll('.btn-editar-medicion');
    botonesEditar.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se expanda/colapse la tarjeta
            const id = this.dataset.id;
            if (id) {
                mostrarModalEditarMedicion(id);
            }
        });
    });
    
    // Botones de eliminar medición
    const botonesEliminar = document.querySelectorAll('.btn-eliminar-medicion');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation(); // Evitar que se expanda/colapse la tarjeta
            const id = this.dataset.id;
            if (!id) return;
            
            const confirmar = confirm('¿Estás seguro de que quieres eliminar esta medición? Esta acción no se puede deshacer.');
            if (!confirmar) return;
            
            try {
                await eliminarMedicion(id);
                
                // Actualizar historial global
                historialCorporalGlobal = await obtenerHistorialCorporal();
                
                // Recargar la vista
                await mostrarVistaPerfil();
                
                // Restaurar el filtro activo
                const activeFilterBtn = document.querySelector(`.chart-filter-btn[data-filter="${filtroGraficaActual}"]`);
                if (activeFilterBtn) {
                    document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
                    activeFilterBtn.classList.add('active');
                }
                
                alert('Medición eliminada correctamente');
            } catch (error) {
                alert('Error al eliminar la medición. Por favor, intenta de nuevo.');
            }
        });
    });
}

// Función para manejar el guardado del perfil
async function manejarGuardarPerfil() {
    const form = document.getElementById('form-perfil');
    if (!form) return;
    
    const nombre = form.querySelector('#nombre-perfil').value.trim();
    const peso = parseFloat(form.querySelector('#peso-perfil').value);
    const altura = parseFloat(form.querySelector('#altura-perfil').value);
    const edad = parseInt(form.querySelector('#edad-perfil').value);
    
    // Validaciones básicas
    if (!nombre) {
        alert('Por favor, ingresa tu nombre');
        return;
    }
    
    if (peso && (peso <= 0 || peso > 500)) {
        alert('Por favor, ingresa un peso válido (entre 1 y 500 kg)');
        return;
    }
    
    if (altura && (altura <= 0 || altura > 300)) {
        alert('Por favor, ingresa una altura válida (entre 1 y 300 cm)');
        return;
    }
    
    if (edad && (edad <= 0 || edad > 150)) {
        alert('Por favor, ingresa una edad válida (entre 1 y 150 años)');
        return;
    }
    
    const boton = form.querySelector('button[type="submit"]');
    if (boton) {
        boton.classList.add('is-loading');
    }
    
    try {
        // Guardar en Firebase
        await guardarPerfil({
            nombre,
            peso: peso || null,
            altura: altura || null,
            edad: edad || null
        });
        
        // Recargar la vista
        await mostrarVistaPerfil();
        
        // Cerrar modal
        ocultarModalPerfil();
    } catch (error) {
        alert('Error al guardar el perfil. Por favor, intenta de nuevo.');
    } finally {
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para mostrar el modal de perfil
async function mostrarModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (!modal) return;
    
    // Cargar datos actuales desde Firebase
    try {
        const datosPerfil = await obtenerPerfil();
        const form = document.getElementById('form-perfil');
        if (form) {
            form.querySelector('#nombre-perfil').value = datosPerfil.nombre || '';
            form.querySelector('#peso-perfil').value = datosPerfil.peso || '';
            form.querySelector('#altura-perfil').value = datosPerfil.altura || '';
            form.querySelector('#edad-perfil').value = datosPerfil.edad || '';
        }
    } catch (error) {
        // Si falla, intentar cargar desde el DOM
        const datosPerfil = document.querySelector('.perfil-data');
        if (datosPerfil) {
            const nombre = datosPerfil.dataset.nombre || '';
            const peso = datosPerfil.dataset.peso || '';
            const altura = datosPerfil.dataset.altura || '';
            const edad = datosPerfil.dataset.edad || '';
            
            const form = document.getElementById('form-perfil');
            if (form) {
                form.querySelector('#nombre-perfil').value = nombre;
                form.querySelector('#peso-perfil').value = peso;
                form.querySelector('#altura-perfil').value = altura;
                form.querySelector('#edad-perfil').value = edad;
            }
        }
    }
    
    modal.style.display = 'flex';
    modal.classList.add('active');
}

// Función para ocultar el modal de perfil
function ocultarModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// Función para mostrar el modal de medición (nuevo registro)
function mostrarModalMedicion() {
    const modal = document.getElementById('modal-medicion');
    if (!modal) return;
    
    // Resetear estado de edición
    medicionEditandoId = null;
    
    // Actualizar título del modal
    const modalTitulo = modal.querySelector('h3');
    if (modalTitulo) {
        modalTitulo.textContent = 'Registrar Medición';
    }
    
    // Limpiar y establecer fecha actual por defecto
    const form = document.getElementById('form-medicion');
    if (form) {
        form.reset();
        const fechaInput = form.querySelector('#fecha-medicion');
        if (fechaInput) {
            fechaInput.value = obtenerFechaLocal();
        }
    }
    
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // Ocultar botones flotantes cuando se muestra el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
}

// Función para mostrar el modal de medición (editar registro)
async function mostrarModalEditarMedicion(id) {
    const modal = document.getElementById('modal-medicion');
    if (!modal) return;
    
    try {
        // Obtener datos del registro
        const historial = historialCorporalGlobal || await obtenerHistorialCorporal();
        const medicion = historial.find(m => m.id === id);
        
        if (!medicion) {
            alert('No se encontró la medición a editar');
            return;
        }
        
        // Establecer estado de edición
        medicionEditandoId = id;
        
        // Actualizar título del modal
        const modalTitulo = modal.querySelector('h3');
        if (modalTitulo) {
            modalTitulo.textContent = 'Editar Medición';
        }
        
        // Rellenar formulario con datos existentes
        const form = document.getElementById('form-medicion');
        if (form) {
            const fechaInput = form.querySelector('#fecha-medicion');
            const pesoInput = form.querySelector('#peso-medicion');
            const grasaInput = form.querySelector('#grasa-medicion');
            const musculoInput = form.querySelector('#musculo-medicion');
            const aguaInput = form.querySelector('#agua-medicion');
            const visceralInput = form.querySelector('#visceral-medicion');
            
            if (fechaInput && medicion.fecha) {
                // Usar el string directamente sin conversión UTC
                // Si viene como string "YYYY-MM-DD", usarlo tal cual
                // Si viene como timestamp, convertirlo a string local
                if (typeof medicion.fecha === 'string' && medicion.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    fechaInput.value = medicion.fecha;
                } else {
                    // Si es un timestamp o formato diferente, convertir a fecha local
                    const fecha = new Date(medicion.fecha);
                    const year = fecha.getFullYear();
                    const month = String(fecha.getMonth() + 1).padStart(2, '0');
                    const day = String(fecha.getDate()).padStart(2, '0');
                    fechaInput.value = `${year}-${month}-${day}`;
                }
            }
            if (pesoInput) pesoInput.value = medicion.peso || '';
            if (grasaInput) grasaInput.value = medicion.grasa || '';
            if (musculoInput) musculoInput.value = medicion.musculo || '';
            if (aguaInput) aguaInput.value = medicion.agua || '';
            if (visceralInput) visceralInput.value = medicion.visceral || '';
        }
        
        modal.style.display = 'flex';
        modal.classList.add('active');
        
        // Ocultar botones flotantes cuando se muestra el modal
        document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
    } catch (error) {
        alert('Error al cargar la medición. Por favor, intenta de nuevo.');
    }
}

// Función para ocultar el modal de medición
function ocultarModalMedicion() {
    const modal = document.getElementById('modal-medicion');
    if (!modal) return;
    
    modal.style.display = 'none';
    modal.classList.remove('active');
    
    // Mostrar botones flotantes cuando se oculta el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'flex';
    });
}

// Función para manejar el guardado de medición
async function manejarGuardarMedicion() {
    const form = document.getElementById('form-medicion');
    if (!form) return;
    
    // Obtener fecha directamente como string YYYY-MM-DD (sin conversión a Date)
    const fechaInput = form.querySelector('#fecha-medicion');
    const fecha = fechaInput ? fechaInput.value : null; // String directo: "2024-11-21"
    const peso = parseFloat(form.querySelector('#peso-medicion').value);
    const grasa = parseFloat(form.querySelector('#grasa-medicion').value);
    const musculo = parseFloat(form.querySelector('#musculo-medicion').value);
    const agua = parseFloat(form.querySelector('#agua-medicion').value);
    const visceral = parseFloat(form.querySelector('#visceral-medicion').value);
    
    // Validaciones básicas
    if (!fecha) {
        alert('Por favor, selecciona una fecha');
        return;
    }
    
    if (!peso || peso <= 0 || peso > 500) {
        alert('Por favor, ingresa un peso válido (entre 1 y 500 kg)');
        return;
    }
    
    // Cerrar modal inmediatamente
    ocultarModalMedicion();
    
    // Mostrar spinner global
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.display = 'flex';
    }
    
    try {
        // Guardar o actualizar en Firebase
        if (medicionEditandoId) {
            // Actualizar medición existente
            await actualizarMedicion(medicionEditandoId, {
                fecha,
                peso,
                grasa: grasa || null,
                musculo: musculo || null,
                agua: agua || null,
                visceral: visceral || null
            });
        } else {
            // Crear nueva medición
            await guardarMedicion({
                fecha,
                peso,
                grasa: grasa || null,
                musculo: musculo || null,
                agua: agua || null,
                visceral: visceral || null
            });
        }
        
        // Resetear estado de edición
        medicionEditandoId = null;
        
        // Actualizar historial global
        historialCorporalGlobal = await obtenerHistorialCorporal();
        
        // Recargar la vista
        await mostrarVistaPerfil();
        
        // Restaurar el filtro activo
        const activeFilterBtn = document.querySelector(`.chart-filter-btn[data-filter="${filtroGraficaActual}"]`);
        if (activeFilterBtn) {
            document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            activeFilterBtn.classList.add('active');
        }
        
        // Limpiar formulario
        form.reset();
    } catch (error) {
        alert('Error al guardar la medición. Por favor, intenta de nuevo.');
    } finally {
        // Ocultar spinner global
        if (loader) {
            loader.style.display = 'none';
        }
    }
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
    
    // Ocultar botones flotantes cuando se muestra el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'none';
    });
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
    
    // Mostrar botones flotantes cuando se oculta el modal
    document.querySelectorAll('.btn-anadir, #btn-abrir-modal-registro').forEach(btn => {
        if (btn) btn.style.display = 'flex';
    });
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
        } else {
            // Es nueva
            await agregarCategoria(nombre);
        }
        
        // 4. Recargar la lista de categorías
        const categorias = await obtenerCategorias();
        renderizarListaCategorias(categorias, editarCategoriaHandler, eliminarCategoriaHandler, mostrarVistaCategoriaEjercicios);
        
        // 5. Resetear el ID de edición
        currentlyEditingCategoriaId = null;
        
        // 6. Cerrar el modal
        ocultarModalCategoria();
        
    } catch (error) {
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
    } catch (error) {
        // 3. Manejar el error
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
        
    } catch (error) {
        // Si falla, reemplaza el spinner con un error
        const listaContainer = document.getElementById('lista-ejercicios-categoria-container');
        if (listaContainer) {
            listaContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Error al cargar ejercicios de la categoría.</p>';
        }
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
        } else {
            // Agregar nuevo ejercicio
            await agregarEjercicioACategoria(categoriaActual.id, ejercicioData);
        }
        
        // 4. Recargar la lista de ejercicios
        const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
        renderizarListaEjerciciosCategoria(ejercicios, editarEjercicioCategoriaHandler, eliminarEjercicioCategoriaHandler);
        
        // 5. Cerrar el modal
        ocultarModalEjercicioCategoria();
        
        // 7. Resetear el ID de edición
        currentlyEditingEjercicioCategoriaId = null;
        
    } catch (error) {
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
    } catch (error) {
        // 3. Manejar el error
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
        return;
    }
    
    const ejercicios = await obtenerEjerciciosDeCategoria(categoriaActual.id);
    const ejercicio = ejercicios.find(e => e.id === ejercicioId);
    
    if (!ejercicio) {
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


// Función para editar un ejercicio de la biblioteca (maneja la UI)
async function editarEjercicioBibliotecaHandler(ejercicioId) {
    try {
        const ejercicios = await obtenerEjerciciosBiblioteca();
        const ejercicio = ejercicios.find(e => e.id === ejercicioId);
        
        if (!ejercicio) {
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
        
        // 3. Refrescar la vista actual si estamos viendo un entreno que contenía este ejercicio
        if (entrenoActual) {
            try {
                // Recargar el entreno actual para reflejar los cambios
                await mostrarVistaEntreno(entrenoActual);
            } catch (error) {
                // No mostrar error al usuario, solo loguear
            }
        }
    } catch (error) {
        // 3. Manejar el error
        alert('Error al eliminar el ejercicio. Por favor, intenta de nuevo.');
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (botonElement) {
            botonElement.classList.remove('is-loading');
        }
    }
}

// Función auxiliar para renderizar registros paginados del ejercicio
function renderizarRegistrosPaginados() {
    // Calcular total de páginas
    const totalPaginas = Math.ceil(registrosEjercicioGlobal.length / REGISTROS_POR_PAGINA_EJERCICIO) || 1;
    
    // Calcular índices
    const inicio = (paginaActualEjercicio - 1) * REGISTROS_POR_PAGINA_EJERCICIO;
    const fin = inicio + REGISTROS_POR_PAGINA_EJERCICIO;
    
    // Obtener el slice del array
    const registrosSlice = registrosEjercicioGlobal.slice(inicio, fin);
    
    // Llamar a la función de UI existente con el slice y los parámetros de paginación
    renderizarListaRegistros(registrosSlice, editarRegistro, eliminarRegistro, paginaActualEjercicio, totalPaginas);
    
    // Configurar event listeners para los botones de paginación
    const btnPrev = document.getElementById('btn-prev-ejercicio');
    const btnNext = document.getElementById('btn-next-ejercicio');
    
    if (btnPrev) {
        btnPrev.addEventListener('click', function() {
            if (paginaActualEjercicio > 1) {
                paginaActualEjercicio--;
                renderizarRegistrosPaginados();
            }
        });
    }
    
    if (btnNext) {
        btnNext.addEventListener('click', function() {
            if (paginaActualEjercicio < totalPaginas) {
                paginaActualEjercicio++;
                renderizarRegistrosPaginados();
            }
        });
    }
}

// Función para mostrar la vista de ejercicio (registro de progreso)
async function mostrarVistaEjercicio(ejercicioId) {
    if (!entrenoActual) {
        return;
    }
    
    // Obtener el ejercicio
    const ejercicio = await obtenerEjercicio(entrenoActual.id, ejercicioId);
    if (!ejercicio) {
        return;
    }
    
    ejercicioActual = ejercicio;
    
    // Obtener registros (si existen) y guardarlos en la variable global
    const registros = ejercicio.registros || [];
    registrosEjercicioGlobal = registros;
    
    // Resetear la página a la primera
    paginaActualEjercicio = 1;
    
    // Resetear el ID de edición de registro
    currentlyEditingRegistroId = null;
    
    // 1. Renderizar la vista completa (pasar null o array vacío en registros)
    renderizarEjercicioView(ejercicio, [], editarRegistro, eliminarRegistro);
    
    // 2. Mostrar la vista
    showView(getEjercicioView());
    
    // 3. Renderizar registros paginados después de que la vista esté en el DOM
    renderizarRegistrosPaginados();
    
    // 4. Actualizar breadcrumbs DESPUÉS de que el HTML esté en el DOM
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
        // Asegurarse de que entrenoActual y ejercicio estén disponibles
        if (entrenoActual && ejercicio) {
            const ejercicioView = getEjercicioView();
            const breadcrumbsContainer = ejercicioView ? ejercicioView.querySelector('#breadcrumbs') : null;
            
            // Pasar el contenedor directamente a la función
            actualizarBreadcrumbs([
                { texto: 'Entrenos', vista: 'dashboard-view' },
                { texto: entrenoActual.nombre, vista: 'entreno-view', action: 'mostrarEntreno', param: entrenoActual.id },
                { texto: ejercicio.nombre }
            ], manejarNavegacionBreadcrumbs, breadcrumbsContainer);
        }
    }, 10);
    
    // 5. Configurar event listeners
    configurarEventListenersEjercicioView();
    
    // El botón volver ahora se maneja con delegación de eventos global en initApp
}

// Función para configurar event listeners de la vista de ejercicio
function configurarEventListenersEjercicioView() {
    const formNuevoRegistro = getFormNuevoRegistro();
    const btnAbrirModalRegistro = document.getElementById('btn-abrir-modal-registro');
    const btnCancelarRegistro = document.getElementById('btn-cancelar-registro');
    
    // Botón para abrir modal de registro
    if (btnAbrirModalRegistro) {
        btnAbrirModalRegistro.addEventListener('click', async function() {
            // Resetear el estado de edición
            currentlyEditingRegistroId = null;
            // Resetear el formulario y abrir el modal
            ocultarModalRegistro(); // Primero resetear
            setTimeout(async () => {
                // Pasar los IDs del entreno y ejercicio actual para obtener el último registro
                if (entrenoActual && ejercicioActual) {
                    await mostrarModalRegistro(entrenoActual.id, ejercicioActual.id);
                } else {
                    await mostrarModalRegistro();
                }
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
        return;
    }
    
    const form = e.target;
    const boton = form.querySelector('button[type="submit"]');
    // Obtener fecha directamente como string YYYY-MM-DD (sin conversión a Date)
    const fechaInput = form.querySelector('#fecha-registro');
    const fecha = fechaInput ? fechaInput.value : null; // String directo: "2024-11-21"
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
        } else {
            // ESTAMOS CREANDO UN NUEVO REGISTRO
            await agregarRegistroAEjercicio(entrenoActual.id, ejercicioActual.id, datosRegistro);
        }
        
        // Actualizar el ejercicio actual con los nuevos registros
        ejercicioActual = await obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
        const registros = ejercicioActual.registros || [];
        
        // Actualizar la variable global de registros
        registrosEjercicioGlobal = registros;
        // Resetear a la página 1 para mostrar el nuevo registro
        paginaActualEjercicio = 1;
        
        // Actualizar la lista de registros usando paginación
        renderizarRegistrosPaginados();
        
        // Limpiar el formulario
        form.reset();
        
        // Restaurar la fecha a hoy
        form.querySelector('#fecha-registro').value = obtenerFechaLocal();
        
        // Resetear el ID de edición
        currentlyEditingRegistroId = null;
        
        // Cambiar el texto del botón de vuelta a "Guardar"
        if (boton) {
            boton.textContent = 'Guardar';
        }
        
        // Cerrar el modal después de guardar
        ocultarModalRegistro();
        
    } catch (error) {
        // 3. Manejar el error
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
        return;
    }
    
    // Obtener el registro
    const registros = ejercicioActual.registros || [];
    const registro = registros.find(r => r.id === registroId);
    
    if (!registro) {
        return;
    }
    
    // Guardar el ID del registro que se está editando
    currentlyEditingRegistroId = registroId;
    
    // Poblar el formulario con los datos del registro
    const form = document.getElementById('form-nuevo-registro');
    if (!form) {
        return;
    }
    
    // Fecha
    const fechaInput = form.querySelector('#fecha-registro');
    if (fechaInput) {
        // Usar el string directamente sin conversión UTC
        // Si viene como string "YYYY-MM-DD", usarlo tal cual
        if (typeof registro.fecha === 'string' && registro.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            fechaInput.value = registro.fecha;
        } else {
            // Si es un timestamp o formato diferente, convertir a fecha local
            const fecha = new Date(registro.fecha);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            fechaInput.value = `${year}-${month}-${day}`;
        }
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
                form.querySelector('#fecha-registro').value = obtenerFechaLocal();
                
                // Cambiar el texto del botón de vuelta a "Guardar"
                const btnSubmit = form.querySelector('button[type="submit"]');
                if (btnSubmit) {
                    btnSubmit.textContent = 'Guardar';
                }
            }
        }
        
        // Actualizar el ejercicio actual
        ejercicioActual = await obtenerEjercicio(entrenoActual.id, ejercicioActual.id);
        const registros = ejercicioActual.registros || [];
        
        // Actualizar la variable global de registros
        registrosEjercicioGlobal = registros;
        // Ajustar la página actual si es necesario (si eliminamos el último registro de la última página)
        const totalPaginas = Math.ceil(registrosEjercicioGlobal.length / REGISTROS_POR_PAGINA_EJERCICIO) || 1;
        if (paginaActualEjercicio > totalPaginas && totalPaginas > 0) {
            paginaActualEjercicio = totalPaginas;
        } else if (totalPaginas === 0) {
            paginaActualEjercicio = 1;
        }
        
        // Actualizar la lista de registros usando paginación
        renderizarRegistrosPaginados();
    } catch (error) {
        // 3. Manejar el error
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
        
        // Actualizar barra de progreso
        actualizarBarraProgreso();
    } catch (error) {
        // 3. Manejar el error
    } finally {
        // 4. Quitar estado de carga (SIEMPRE se ejecuta)
        if (boton) {
            boton.classList.remove('is-loading');
        }
    }
}

// Función para actualizar la barra de progreso
function actualizarBarraProgreso() {
    const listaContainer = document.getElementById('lista-ejercicios-container');
    if (!listaContainer) {
        return;
    }
    
    // Contar todas las tarjetas de ejercicio
    const todasLasTarjetas = listaContainer.querySelectorAll('.ejercicio-card');
    const total = todasLasTarjetas.length;
    
    // Contar las tarjetas completadas (tienen la clase card-completed o el checkbox marcado)
    const completadas = Array.from(todasLasTarjetas).filter(card => {
        return card.classList.contains('card-completed') || 
               card.querySelector('.btn-check:checked') !== null;
    }).length;
    
    // Calcular el porcentaje (manejar división por cero)
    const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
    
    // Actualizar el ancho de la barra de progreso
    const progressFill = document.getElementById('progress-fill');
    if (progressFill) {
        progressFill.style.width = `${porcentaje}%`;
    }
    
    // Actualizar el porcentaje de texto
    const progressPercent = document.getElementById('progress-percent');
    if (progressPercent) {
        progressPercent.textContent = `${porcentaje}%`;
    }
    
    // Actualizar el texto de detalle
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${completadas} de ${total} ejercicios`;
    }
}

// Función para toggle del estado completado de un ejercicio (UI Optimista)
async function toggleCompletado(entrenoId, ejercicioId) {
    try {
        // Paso 1: Obtener ejercicios actuales de la lista en memoria
        const ejerciciosActuales = await obtenerEjerciciosDeEntreno(entrenoId);
        
        // Verificar que no haya duplicados por ID (por seguridad)
        const ejerciciosUnicos = [];
        const idsVistos = new Set();
        for (const ej of ejerciciosActuales) {
            if (!idsVistos.has(ej.id)) {
                idsVistos.add(ej.id);
                ejerciciosUnicos.push(ej);
            }
        }
        // Si había duplicados, usar el array limpio
        const ejerciciosParaUsar = ejerciciosUnicos.length !== ejerciciosActuales.length ? ejerciciosUnicos : ejerciciosActuales;
        
        // Buscar el ejercicio en la lista local
        const ejercicio = ejerciciosParaUsar.find(e => e.id === ejercicioId);
        if (!ejercicio) {
            return;
        }
        
        // Paso 2: Invertir el estado localmente
        // Usar formato YYYY-MM-DD para consistencia estricta
        const fechaHoyString = obtenerFechaLocal();
        const fechaCompletadoActual = ejercicio.fechaCompletado || null;
        
        // Normalizar fechaCompletadoActual a formato YYYY-MM-DD para comparación estricta
        let fechaCompletadoString = null;
        if (fechaCompletadoActual) {
            if (typeof fechaCompletadoActual === 'string' && fechaCompletadoActual.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Ya está en formato YYYY-MM-DD
                fechaCompletadoString = fechaCompletadoActual;
            } else {
                // Convertir a YYYY-MM-DD
                fechaCompletadoString = obtenerFechaLocal(new Date(fechaCompletadoActual));
            }
        }
        
        // Invertir estado: si está completado hoy, desmarcar; si no, marcar como completado
        const nuevoFechaCompletado = fechaCompletadoString === fechaHoyString ? null : fechaHoyString;
        const estado = nuevoFechaCompletado !== null ? 'completado' : 'desmarcado';
        
        // Actualizar el ejercicio en la lista local (modificar propiedades, NO crear duplicados)
        ejercicio.fechaCompletado = nuevoFechaCompletado;
        ejercicio.isCompletedToday = nuevoFechaCompletado === fechaHoyString;
        
        // Obtener datos del entreno para pasar a storage (usar array sin duplicados)
        const totalEjercicios = ejerciciosParaUsar.length;
        const entrenoNombre = entrenoActual ? entrenoActual.nombre : 'Entreno';
        
        // Paso 3: Actualizar la UI INMEDIATAMENTE (usar array sin duplicados)
        const onToggle = (id) => toggleCompletado(entrenoId, id);
        renderizarListaEjercicios(ejerciciosParaUsar, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
        
        // Actualizar barra de progreso
        actualizarBarraProgreso();
        
        // Paso 4: Enviar a Firebase (sin await bloqueante)
        toggleCompletadoEjercicio(entrenoId, ejercicioId, estado, entrenoNombre, totalEjercicios).catch(error => {
            // Si Firebase falla, revertir el cambio local
            
            // Revertir el cambio (restaurar el valor original)
            ejercicio.fechaCompletado = fechaCompletadoActual;
            // Recalcular isCompletedToday con el valor original
            const fechaHoyStringRevert = obtenerFechaLocal();
            let fechaCompletadoStringRevert = null;
            if (fechaCompletadoActual) {
                if (typeof fechaCompletadoActual === 'string' && fechaCompletadoActual.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    fechaCompletadoStringRevert = fechaCompletadoActual;
                } else {
                    fechaCompletadoStringRevert = obtenerFechaLocal(new Date(fechaCompletadoActual));
                }
            }
            ejercicio.isCompletedToday = fechaCompletadoStringRevert === fechaHoyStringRevert;
            
            // Volver a pintar con el estado original (usar array sin duplicados)
            renderizarListaEjercicios(ejerciciosParaUsar, null, eliminarEjercicio, mostrarVistaEjercicio, sustituirEjercicio, onToggle);
            
            // Actualizar barra de progreso
            actualizarBarraProgreso();
            
            // Mostrar error al usuario
            if (typeof showInfoModal === 'function') {
                showInfoModal('Error', 'No se pudo actualizar el estado. Por favor, intenta de nuevo.');
            } else {
                alert('Error al actualizar el estado. Por favor, intenta de nuevo.');
            }
        });
    } catch (error) {
        if (typeof showInfoModal === 'function') {
            showInfoModal('Error', 'Error al actualizar el estado. Por favor, intenta de nuevo.');
        } else {
            alert('Error al actualizar el estado. Por favor, intenta de nuevo.');
        }
    }
}

// Función para sustituir un ejercicio
async function sustituirEjercicio(ejercicioId) {
    const ejercicios = await obtenerEjerciciosDeEntreno(entrenoActual.id);
    const ejercicio = ejercicios.find(e => e.id === ejercicioId);
    
    if (!ejercicio) {
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
        
        // Paso 3: Actualizar modal con los datos reales (siempre se ejecuta, incluso si está vacío)
        renderizarModalSeleccionEjercicio(ejerciciosPorCategoria);
        
        // Si no hay ejercicios, mostrar mensaje
        if (!ejerciciosPorCategoria || ejerciciosPorCategoria.length === 0) {
            const modalContent = modalSeleccion?.querySelector('.modal-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <h3>SELECCIONAR EJERCICIO</h3>
                    <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                        No se encontraron ejercicios en la biblioteca.
                    </p>
                    <div class="modal-buttons">
                        <button type="button" id="btn-cerrar-seleccion" class="btn btn-secondary">Cancelar</button>
                    </div>
                `;
                // Reconfigurar el listener del botón cerrar
                const btnCerrar = document.getElementById('btn-cerrar-seleccion');
                if (btnCerrar) {
                    btnCerrar.addEventListener('click', function() {
                        modalSeleccion.style.display = 'none';
                    });
                }
            }
        } else {
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
        }
    } catch (error) {
        // Este catch nunca debería ejecutarse ahora (la función siempre devuelve array)
        // Pero lo mantenemos por seguridad
        // Mostrar error en el modal
        const modalContent = modalSeleccion?.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <h3>SELECCIONAR EJERCICIO</h3>
                <p style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    No se encontraron ejercicios en la biblioteca.
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
                
                // Actualizar barra de progreso
                actualizarBarraProgreso();
            } catch (error) {
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

// Función para calcular la racha semanal
// Función auxiliar para obtener el número de semana en formato ISO (ej: "2025-W47")
// Acepta tanto objetos Date como strings de fecha "YYYY-MM-DD"
function obtenerNumeroSemana(fecha) {
    let d;
    
    // Si es un string "YYYY-MM-DD", convertirlo a Date
    if (typeof fecha === 'string') {
        // Usar 'T12:00:00' para evitar problemas de timezone
        d = new Date(fecha + 'T12:00:00');
    } else {
        // Si es un objeto Date, crear una copia para no modificar la original
        d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    }
    
    // Ajustar al lunes de la semana (ISO 8601: semana empieza en lunes)
    const dayNum = d.getUTCDay() || 7; // 0 (domingo) -> 7, 1-6 (lunes-sábado) -> 1-6
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    
    // Obtener el primer día del año
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    
    // Calcular el número de semana
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    
    // Formato: "YYYY-WNN"
    return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Función principal para calcular la racha semanal
// Recibe un array de objetos con datos enriquecidos: { fecha, cantidadCompletada, totalEjercicios, ... }
function calcularRachaSemanal(listaDeDias) {
    if (!listaDeDias || listaDeDias.length === 0) {
        return 0;
    }
    
    // 1. Filtrar solo días que cuentan para la racha (cantidadCompletada >= 3)
    const diasQueCuentan = listaDeDias.filter(dia => {
        const cantidad = typeof dia === 'string' ? 0 : (dia.cantidadCompletada || 0);
        return cantidad >= 3; // Amarillo o Verde
    });
    
    if (diasQueCuentan.length === 0) {
        return 0;
    }
    
    // 2. Extraer fechas y eliminar duplicados
    const fechasUnicas = [...new Set(diasQueCuentan.map(dia => typeof dia === 'string' ? dia : dia.fecha))];
    
    // 3. Ordenar fechas de más reciente a más antigua
    fechasUnicas.sort((a, b) => b.localeCompare(a));
    
    // 4. Agrupar fechas por semana (usando formato ISO: "2025-W47")
    const semanasMap = new Map();
    fechasUnicas.forEach(fechaString => {
        const claveSemana = obtenerNumeroSemana(fechaString);
        
        if (!semanasMap.has(claveSemana)) {
            semanasMap.set(claveSemana, new Set());
        }
        semanasMap.get(claveSemana).add(fechaString);
    });
    
    // 5. Obtener la semana actual
    const hoy = new Date();
    const claveSemanaActual = obtenerNumeroSemana(hoy);
    
    // 6. Convertir Map a Array y ordenar semanas de más reciente a más antigua
    const semanasOrdenadas = Array.from(semanasMap.entries()).sort((a, b) => {
        const [añoA, semanaA] = a[0].split('-W').map(Number);
        const [añoB, semanaB] = b[0].split('-W').map(Number);
        if (añoA !== añoB) return añoB - añoA;
        return semanaB - semanaA;
    });
    
    // 7. Calcular racha desde la semana actual (o inmediatamente anterior) hacia atrás
    let racha = 0;
    let encontroSemanaActual = false;
    
    for (const [claveSemana, diasSet] of semanasOrdenadas) {
        const diasEnSemana = diasSet.size; // Contar días únicos que cuentan para racha
        
        const esSemanaActual = claveSemana === claveSemanaActual;
        
        if (esSemanaActual) {
            encontroSemanaActual = true;
            // Semana actual: si tiene >= 4 días, cuenta. Si no, no rompe la racha (todavía estás a tiempo)
            if (diasEnSemana >= 4) {
                racha++;
            }
        } else {
            // Semanas pasadas
            if (diasEnSemana >= 4) {
                racha++;
            } else {
                // Si la semana pasada tiene < 4 días, se rompe la racha
                if (encontroSemanaActual) {
                    break; // STOP: se rompió la racha
                }
            }
        }
    }
    
    return racha;
}

// Función para actualizar nombres de entrenos (ejecutar una vez)
async function actualizarNombresEntrenos() {
    try {
        const entrenos = await cargarEntrenos() || [];
        
        // Mapeo de nombres antiguos a nuevos
        const mapeoNombres = {
            'piernas-abdomen': 'Piernas',
            'Piernas - Abdomen': 'Piernas',
            'Piernas': 'Piernas', // Por si acaso
            'Pecho - hombro - tricep - abdomen': 'Push',
            'Pecho - hombro - Tricep - abdomen': 'Push',
            'Pecho - hombro- Tricep - abdomen': 'Push', // Con espacio después del guion
            'Espada - hombro - trisep': 'Pull',
            'Espalda - hombro - tricep': 'Pull',
            'Espalda - Hombro - Bisep': 'Pull', // Con mayúsculas
            'Cola - lumbar - abdomen': 'Gluteos',
            'Cola - Lumbar - Abdomen': 'Gluteos', // Con mayúsculas
            'Gluteos - lumbar - abdomen': 'Gluteos'
        };
        
        let actualizados = 0;
        for (const entreno of entrenos) {
            const nombreActual = entreno.nombre;
            const nuevoNombre = mapeoNombres[nombreActual];
            
            if (nuevoNombre && nuevoNombre !== nombreActual) {
                await actualizarNombreEntreno(entreno.id, nuevoNombre);
                actualizados++;
            }
        }
        
        if (actualizados > 0) {
        }
    } catch (error) {
    }
}

// Función para cachear imágenes usando mode: 'no-cors'
// Esto crea respuestas "opaque" que SÍ se pueden cachear aunque no se puedan leer
// Es la única forma de cachear imágenes de Firebase Storage sin configuración CORS
async function cachearImagenesManualmente(entrenos) {
    if (!('caches' in window) || !entrenos || entrenos.length === 0) {
        return;
    }
    
    try {
        const cache = await caches.open('dynamic-v1');
        const urlsParaCachear = [];
        
        // Recopilar todas las URLs de imágenes de entrenos
        entrenos.forEach(entreno => {
            if (entreno.imagen && entreno.imagen.startsWith('http')) {
                urlsParaCachear.push(entreno.imagen);
            }
        });
        
        // También cachear la imagen de perfil del header
        const profilePic = document.querySelector('.profile-pic');
        if (profilePic && profilePic.src && profilePic.src.startsWith('http')) {
            urlsParaCachear.push(profilePic.src);
        }
        
        
        // Cachear cada imagen usando mode: 'no-cors'
        // Esto crea respuestas "opaque" que SÍ se pueden cachear
        const promesasCache = urlsParaCachear.map(async (url) => {
            try {
                // Verificar si ya está en caché
                const cached = await cache.match(url);
                if (cached) {
                    return;
                }
                
                // Usar mode: 'no-cors' para evitar problemas de CORS
                // Esto crea una respuesta "opaque" que SÍ se puede cachear
                const response = await fetch(url, {
                    mode: 'no-cors', // Clave: esto evita CORS pero crea respuesta "opaque"
                    credentials: 'omit'
                });
                
                // Las respuestas "opaque" siempre tienen status 0, pero se pueden cachear
                if (response) {
                    await cache.put(url, response);
                    
                    // Verificar que se guardó
                    const verificacion = await cache.match(url);
                    if (verificacion) {
                    }
                } else {
                }
            } catch (error) {
            }
        });
        
        await Promise.allSettled(promesasCache);
    } catch (error) {
    }
}

// Función para inicializar la aplicación
async function initApp() {
    try {
        // Verificar si existe un usuario en localStorage
        const usuarioId = obtenerUsuarioActual();
        const modalSeleccionPerfil = document.getElementById('modal-seleccion-perfil');
        const mainHeader = document.getElementById('main-header');
        const mainContainer = document.querySelector('.main-container');
        const tabBar = document.getElementById('tab-bar');
        
        if (!usuarioId) {
            // NO existe usuario: Mostrar modal de selección y ocultar el resto
            if (modalSeleccionPerfil) {
                modalSeleccionPerfil.style.display = 'flex';
            }
            if (mainHeader) {
                mainHeader.style.display = 'none';
            }
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            if (tabBar) {
                tabBar.style.display = 'none';
            }
            
            // Configurar event listeners para los botones de perfil
            const perfilCards = document.querySelectorAll('.perfil-card');
            perfilCards.forEach(card => {
                card.addEventListener('click', function() {
                    const usuarioIdSeleccionado = this.dataset.usuarioId;
                    if (usuarioIdSeleccionado) {
                        setUsuarioActual(usuarioIdSeleccionado);
                    }
                });
            });
            
            // Detener la ejecución aquí - no cargar el resto de la app
            return;
        }
        
        // SÍ existe usuario: Ocultar modal y continuar normalmente
        if (modalSeleccionPerfil) {
            modalSeleccionPerfil.style.display = 'none';
        }
        if (mainHeader) {
            mainHeader.style.display = 'flex';
        }
        if (mainContainer) {
            mainContainer.style.display = 'flex';
        }
        if (tabBar) {
            tabBar.style.display = 'flex';
        }
        
        // Aplicar tema del perfil
        if (usuarioId && PERFILES[usuarioId]) {
            aplicarTema(PERFILES[usuarioId]);
        }
        
        // Actualizar header con información del usuario
        const perfil = obtenerPerfilActual();
        if (perfil) {
            const profilePic = document.querySelector('.profile-pic');
            const headerGreeting = document.querySelector('.header-greeting');
            if (profilePic) {
                profilePic.src = perfil.avatar;
                profilePic.alt = perfil.nombre;
            }
            if (headerGreeting) {
                headerGreeting.textContent = `¡Hola, ${perfil.nombre}!`;
            }
        }
        
        // Actualizar nombres de entrenos (ejecutar una vez, luego comentar)
        // await actualizarNombresEntrenos();
        
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
        
        // Delegación de eventos global para el botón volver flotante
        document.body.addEventListener('click', (e) => {
            // 1. Detectar si el clic fue en el botón volver (o en su ícono interno)
            const btnVolver = e.target.closest('.btn-volver-flotante');
            
            if (btnVolver) {
                e.preventDefault(); // Prevenir comportamientos raros
                e.stopPropagation(); // Evitar que el evento se propague
                
                
                // 2. Detectar qué vista está activa usando display en lugar de .active
                const entrenoView = document.getElementById('entreno-view');
                const ejercicioView = document.getElementById('ejercicio-view');
                const categoriaEjerciciosView = document.getElementById('categoria-ejercicios-view');
                
                // Función auxiliar para verificar si una vista está visible
                const isViewVisible = (view) => {
                    if (!view) return false;
                    const style = window.getComputedStyle(view);
                    return style.display !== 'none' && (style.display === 'flex' || style.display === 'block');
                };
                
                // Lógica de navegación
                if (isViewVisible(entrenoView)) {
                    // Cargar y mostrar el dashboard
                    cargarEntrenos().then(entrenos => {
                        renderizarDashboardView(entrenos, mostrarVistaEntreno);
                        showView(getDashboardView());
                    }).catch(error => {
                        showView(getDashboardView());
                    });
                } 
                else if (isViewVisible(ejercicioView)) {
                    // Volver al entreno actual
                    if (entrenoActual) {
                        mostrarVistaEntreno(entrenoActual);
                    } else {
                        // Fallback: cargar y mostrar dashboard
                        cargarEntrenos().then(entrenos => {
                            renderizarDashboardView(entrenos, mostrarVistaEntreno);
                            showView(getDashboardView());
                        }).catch(error => {
                            showView(getDashboardView());
                        });
                    }
                } 
                else if (isViewVisible(categoriaEjerciciosView)) {
                    mostrarVistaBiblioteca(); // Volver a la lista de categorías
                }
            }
        });
        
        // Delegación de eventos global para el botón "Añadir Ejercicio"
        document.addEventListener('click', (e) => {
            // Detectar clic en el botón Añadir (o sus hijos)
            const btnAnadir = e.target.closest('#btn-anadir-ejercicio');
            
            if (btnAnadir && entrenoActual) {
                // Llamar a la lógica de abrir el modal
                manejarClicAnadirEjercicio();
            }
        });
        
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
                } else if (viewId === 'calendario-view') {
                    mostrarVistaCalendario();
                }
            });
        });
        
        // NOTA: Los event listeners de la vista de entreno (botones, modal, formulario)
        // se configuran en configurarEventListenersEntrenoView(), que se llama
        // después de renderizar la vista de entreno en mostrarVistaEntreno()
        
        // Registrar el Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js', {
                updateViaCache: 'none' // Forzar verificación de actualizaciones en cada carga
            })
                .then(registration => {
                    
                    // Forzar actualización periódica del Service Worker
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Verificar actualizaciones cada minuto
                    
                    // Verificar si hay una actualización disponible
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Opcional: recargar automáticamente cuando el nuevo SW esté listo
                                // window.location.reload();
                            }
                        });
                    });
                    
                    // Cachear imágenes manualmente después de que el Service Worker esté listo
                    // Hacemos fetch desde el contexto de la página para evitar problemas de CORS
                    if (registration.active) {
                        // Esperar un poco para que el SW esté completamente activo
                        setTimeout(() => {
                            cachearImagenesManualmente(entrenos);
                        }, 1000);
                    } else {
                        registration.addEventListener('activate', () => {
                            setTimeout(() => {
                                cachearImagenesManualmente(entrenos);
                            }, 1000);
                        });
                    }
                })
                .catch(error => {
                });
        }
    } catch (error) {
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
    initApp();
});

