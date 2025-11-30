// userSession.js - Gestión de sesión de usuario multi-perfil

// Constante con los perfiles disponibles
export const PERFILES = {
    edgar: { 
        id: 'edgar', 
        nombre: 'Edgar', 
        avatar: 'https://firebasestorage.googleapis.com/v0/b/aplicacion-gim-d3e48.firebasestorage.app/o/foto-perfil.jpg?alt=media&token=fca49d32-9df9-4563-88ad-30f3036c222f',
        theme: {
            primary: '#dfff00', // Verde actual
            hover: '#BFFF00'   // Verde más oscuro
        }
    },
    valentina: { 
        id: 'valentina', 
        nombre: 'Valentina', 
        avatar: 'images/favicon.png', // Placeholder temporal o una URL real si la tienes
        theme: {
            primary: '#FF00CC', // Rosa Neón Vibrante
            hover: '#D100A8'    // Rosa más oscuro
        }
    }
};

// Clave para localStorage
const STORAGE_KEY = 'usuarioActual';

/**
 * Obtiene el ID del usuario actual desde localStorage
 * @returns {string|null} ID del usuario o null si no existe
 */
export function obtenerUsuarioActual() {
    const usuarioId = localStorage.getItem(STORAGE_KEY);
    return usuarioId || null;
}

/**
 * Establece el usuario actual y recarga la página
 * @param {string} usuarioId - ID del usuario ('edgar' o 'valentina')
 */
export function setUsuarioActual(usuarioId) {
    if (!PERFILES[usuarioId]) {
        console.error('Usuario no válido:', usuarioId);
        return;
    }
    
    localStorage.setItem(STORAGE_KEY, usuarioId);
    // Recargar la página para aplicar los cambios
    window.location.reload();
}

/**
 * Cierra la sesión del usuario actual y recarga la página
 */
export function cerrarSesion() {
    localStorage.removeItem(STORAGE_KEY);
    // Recargar la página para volver al modal de selección
    window.location.reload();
}

/**
 * Obtiene el objeto completo del perfil del usuario actual
 * @returns {Object|null} Objeto del perfil o null si no existe
 */
export function obtenerPerfilActual() {
    const usuarioId = obtenerUsuarioActual();
    if (!usuarioId) {
        return null;
    }
    return PERFILES[usuarioId] || null;
}

