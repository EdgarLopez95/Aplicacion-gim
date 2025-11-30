// setupValentina.js - Script para inicializar el perfil de Valentina con entrenos base

import { db } from './firebase-config.js';
import { collection, addDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { obtenerUsuarioActual } from './userSession.js';

/**
 * Crea el perfil y los entrenos base para el perfil de Valentina
 */
export async function crearEntrenosValentina() {
    try {
        // 1. Verificar que el usuario activo sea 'valentina'
        const usuarioActual = obtenerUsuarioActual();
        if (usuarioActual !== 'valentina') {
            throw new Error('Este script solo puede ejecutarse con el perfil de Valentina activo.');
        }

        // 2. Crear el Perfil de Valentina (Para que exista el documento 'valentina' en usuarios)
        // Ruta basada en la lógica de storage: usuarios/valentina/perfil/datos
        const perfilRef = doc(db, 'usuarios/valentina/perfil/datos');
        
        await setDoc(perfilRef, {
            nombre: 'Valentina',
            edad: 25, // Dato placeholder
            peso: 55, // Dato placeholder
            altura: 160, // Dato placeholder
            fechaActualizacion: new Date().toISOString()
        });
        console.log('✅ Perfil de Valentina creado');

        // 3. Crear los Entrenos
        const entrenosRef = collection(db, 'usuarios/valentina/entrenos');
        const datosValentina = [
            { 
                id: 1, 
                nombre: 'Piernas', 
                descripcion: 'Enfoque en cuádriceps y femorales',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/aplicacion-gim-d3e48.firebasestorage.app/o/Pierna-mujer.jpg?alt=media&token=be75caed-5e24-4f20-b917-502b3a6028ac'
            },
            { 
                id: 2, 
                nombre: 'Push', 
                descripcion: 'Pecho, hombro y tríceps',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/aplicacion-gim-d3e48.firebasestorage.app/o/Push-mujer.jpg?alt=media&token=2996b70b-cd6a-44f9-9818-982da549b64b'
            },
            { 
                id: 3, 
                nombre: 'Pull', 
                descripcion: 'Espalda y bíceps',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/aplicacion-gim-d3e48.firebasestorage.app/o/pull-mujer.jpg?alt=media&token=e02352e4-ec0b-4deb-963e-c37472e05ec1'
            },
            { 
                id: 4, 
                nombre: 'Gluteos', 
                descripcion: 'Enfoque en glúteos',
                imagen: 'https://firebasestorage.googleapis.com/v0/b/aplicacion-gim-d3e48.firebasestorage.app/o/Gluteo-mujer.jpg?alt=media&token=9cb94213-69f9-4b59-bbeb-05b988091cdf'
            }
        ];

        for (const entreno of datosValentina) {
            await addDoc(entrenosRef, entreno);
        }
        console.log('✅ Entrenos de Valentina creados');

        alert('¡Perfil de Valentina configurado con éxito! Recargando...');
        window.location.reload();
        
        return true;
    } catch (error) {
        console.error('Error al inicializar perfil de Valentina:', error);
        alert('Error al inicializar perfil de Valentina:\n\n' + error.message);
        throw error;
    }
}

