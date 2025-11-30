// cloneProfile.js - Script para clonar la configuración de Edgar hacia Valentina

import { db } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    writeBatch 
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { obtenerUsuarioActual } from './userSession.js';

/**
 * Clona toda la configuración de Edgar hacia Valentina
 * Mantiene los mismos IDs para preservar referencias
 */
export async function clonarEdgarAValentina() {
    try {
        // Verificar que el usuario activo sea 'valentina'
        const usuarioActual = obtenerUsuarioActual();
        if (usuarioActual !== 'valentina') {
            throw new Error('Este script solo puede ejecutarse con el perfil de Valentina activo.');
        }

        const sourceBase = 'usuarios/edgar';
        const targetBase = 'usuarios/valentina';

        // ============================================
        // PASO 1: Clonar Biblioteca (Categorías y Ejercicios)
        // ============================================
        console.log('📚 Clonando categorías musculares...');
        const categoriasSource = collection(db, `${sourceBase}/categoriasMusculares`);
        const categoriasSnapshot = await getDocs(categoriasSource);

        const batchCategorias = writeBatch(db);
        let categoriasCount = 0;
        let ejerciciosCount = 0;

        for (const categoriaDoc of categoriasSnapshot.docs) {
            const categoriaId = categoriaDoc.id;
            const categoriaData = categoriaDoc.data();

            // Guardar categoría en destino con el mismo ID
            const categoriaTargetRef = doc(db, `${targetBase}/categoriasMusculares/${categoriaId}`);
            batchCategorias.set(categoriaTargetRef, categoriaData);
            categoriasCount++;

            // Leer ejercicios de la categoría
            const ejerciciosSource = collection(db, `${sourceBase}/categoriasMusculares/${categoriaId}/ejercicios`);
            const ejerciciosSnapshot = await getDocs(ejerciciosSource);

            // Guardar ejercicios con el mismo ID
            for (const ejercicioDoc of ejerciciosSnapshot.docs) {
                const ejercicioId = ejercicioDoc.id;
                const ejercicioData = ejercicioDoc.data();

                const ejercicioTargetRef = doc(db, `${targetBase}/categoriasMusculares/${categoriaId}/ejercicios/${ejercicioId}`);
                batchCategorias.set(ejercicioTargetRef, ejercicioData);
                ejerciciosCount++;
            }
        }

        // Ejecutar batch de categorías
        await batchCategorias.commit();
        console.log(`✅ ${categoriasCount} categorías y ${ejerciciosCount} ejercicios clonados`);

        // ============================================
        // PASO 2: Clonar Entrenos (Rutinas y Ejercicios)
        // ============================================
        console.log('🏋️ Clonando entrenos...');
        const entrenosSource = collection(db, `${sourceBase}/entrenos`);
        const entrenosSnapshot = await getDocs(entrenosSource);

        const batchEntrenos = writeBatch(db);
        let entrenosCount = 0;
        let ejerciciosEntrenosCount = 0;

        for (const entrenoDoc of entrenosSnapshot.docs) {
            const entrenoId = entrenoDoc.id;
            const entrenoData = entrenoDoc.data();

            // Guardar entreno en destino con el mismo ID
            const entrenoTargetRef = doc(db, `${targetBase}/entrenos/${entrenoId}`);
            batchEntrenos.set(entrenoTargetRef, entrenoData);
            entrenosCount++;

            // Leer ejercicios del entreno
            const ejerciciosSource = collection(db, `${sourceBase}/entrenos/${entrenoId}/ejercicios`);
            const ejerciciosSnapshot = await getDocs(ejerciciosSource);

            // Guardar ejercicios con el mismo ID, pero limpiando historial
            for (const ejercicioDoc of ejerciciosSnapshot.docs) {
                const ejercicioId = ejercicioDoc.id;
                const ejercicioData = ejercicioDoc.data();

                // Crear copia de los datos
                const dataClonado = { ...ejercicioData };

                // VACIAR HISTORIAL
                dataClonado.registros = [];

                // RESET ESTADO
                dataClonado.fechaCompletado = null;

                const ejercicioTargetRef = doc(db, `${targetBase}/entrenos/${entrenoId}/ejercicios/${ejercicioId}`);
                batchEntrenos.set(ejercicioTargetRef, dataClonado);
                ejerciciosEntrenosCount++;
            }
        }

        // Ejecutar batch de entrenos
        await batchEntrenos.commit();
        console.log(`✅ ${entrenosCount} entrenos y ${ejerciciosEntrenosCount} ejercicios clonados (historial limpiado)`);

        // Mostrar mensaje de éxito
        alert(`¡Configuración clonada exitosamente!\n\n` +
              `📚 ${categoriasCount} categorías y ${ejerciciosCount} ejercicios de biblioteca\n` +
              `🏋️ ${entrenosCount} entrenos y ${ejerciciosEntrenosCount} ejercicios (sin historial)\n\n` +
              `Recargando página...`);
        
        window.location.reload();
        
        return true;
    } catch (error) {
        console.error('Error al clonar configuración:', error);
        alert('Error al clonar configuración:\n\n' + error.message);
        throw error;
    }
}

