// migration.js - Script de migración de datos antiguos a estructura privada por usuario
// ⚠️ SOLO USAR UNA VEZ - Para migrar datos de Edgar

import { db } from './firebase-config.js';
import { obtenerUsuarioActual } from './userSession.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/**
 * Migra los datos antiguos (raíz) a la nueva estructura privada del usuario
 * @returns {Promise<void>}
 */
export async function migrarDatos() {
    try {
        // 1. Verificar que el usuario sea "edgar" (por seguridad)
        const usuarioActual = obtenerUsuarioActual();
        if (usuarioActual !== 'edgar') {
            throw new Error('La migración solo puede ejecutarse con el usuario "edgar"');
        }

        console.log('🚀 Iniciando migración de datos para usuario:', usuarioActual);
        
        const userId = usuarioActual;
        const userBasePath = `usuarios/${userId}`;
        
        // 2. Definir las colecciones a migrar
        const colecciones = [
            'entrenos',
            'historialDias',
            'historialCorporal',
            'categoriasMusculares'
        ];
        
        // 3. Migrar cada colección
        for (const coleccion of colecciones) {
            console.log(`📦 Migrando ${coleccion}...`);
            await migrarColeccion(coleccion, userBasePath);
        }
        
        // 4. Caso especial: Perfil
        console.log('👤 Migrando perfil...');
        await migrarPerfil(userBasePath);
        
        console.log('✅ Migración completada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

/**
 * Migra una colección de la raíz a la ruta privada del usuario
 * @param {string} nombreColeccion - Nombre de la colección a migrar
 * @param {string} userBasePath - Ruta base del usuario (ej: 'usuarios/edgar')
 */
async function migrarColeccion(nombreColeccion, userBasePath) {
    try {
        // Leer documentos de la ruta RAÍZ
        const coleccionRaiz = collection(db, nombreColeccion);
        const snapshot = await getDocs(coleccionRaiz);
        
        if (snapshot.empty) {
            console.log(`   ⚠️ No hay documentos en ${nombreColeccion} para migrar`);
            return;
        }
        
        console.log(`   📄 Encontrados ${snapshot.size} documentos en ${nombreColeccion}`);
        
        // Crear batch para escrituras masivas
        let batch = writeBatch(db);
        let contador = 0;
        const BATCH_LIMIT = 500; // Límite de Firestore
        
        // Ruta destino
        const rutaDestino = `${userBasePath}/${nombreColeccion}`;
        
        // Procesar cada documento
        for (const docSnapshot of snapshot.docs) {
            const datos = docSnapshot.data();
            const docId = docSnapshot.id;
            
            // Crear referencia al nuevo documento
            const nuevoDocRef = doc(db, rutaDestino, docId);
            
            // Agregar al batch
            batch.set(nuevoDocRef, datos);
            contador++;
            
            // Si llegamos al límite del batch, ejecutar y crear uno nuevo
            if (contador >= BATCH_LIMIT) {
                await batch.commit();
                console.log(`   ✅ Migrados ${contador} documentos de ${nombreColeccion}`);
                batch = writeBatch(db); // Crear nuevo batch
                contador = 0;
            }
            
            // Caso especial: Si es categoriasMusculares, migrar también la subcolección de ejercicios
            if (nombreColeccion === 'categoriasMusculares') {
                await migrarSubcoleccionEjercicios(docId, userBasePath);
            }
        }
        
        // Ejecutar el batch final si quedan documentos
        if (contador > 0) {
            await batch.commit();
            console.log(`   ✅ Migrados ${contador} documentos restantes de ${nombreColeccion}`);
        }
        
        console.log(`   ✨ ${nombreColeccion} migrada completamente`);
    } catch (error) {
        console.error(`   ❌ Error migrando ${nombreColeccion}:`, error);
        throw error;
    }
}

/**
 * Migra la subcolección de ejercicios de una categoría
 * @param {string} categoriaId - ID de la categoría
 * @param {string} userBasePath - Ruta base del usuario
 */
async function migrarSubcoleccionEjercicios(categoriaId, userBasePath) {
    try {
        // Leer ejercicios de la ruta RAÍZ
        const ejerciciosRaiz = collection(db, `categoriasMusculares/${categoriaId}/ejercicios`);
        const snapshot = await getDocs(ejerciciosRaiz);
        
        if (snapshot.empty) {
            return; // No hay ejercicios para migrar
        }
        
        console.log(`      📚 Migrando ${snapshot.size} ejercicios de categoría ${categoriaId}...`);
        
        // Crear batch
        let batch = writeBatch(db);
        let contador = 0;
        const BATCH_LIMIT = 500;
        
        // Ruta destino
        const rutaDestino = `${userBasePath}/categoriasMusculares/${categoriaId}/ejercicios`;
        
        // Procesar cada ejercicio
        for (const docSnapshot of snapshot.docs) {
            const datos = docSnapshot.data();
            const docId = docSnapshot.id;
            
            // Crear referencia al nuevo documento
            const nuevoDocRef = doc(db, rutaDestino, docId);
            
            // Agregar al batch
            batch.set(nuevoDocRef, datos);
            contador++;
            
            // Si llegamos al límite del batch, ejecutar y crear uno nuevo
            if (contador >= BATCH_LIMIT) {
                await batch.commit();
                batch = writeBatch(db); // Crear nuevo batch
                contador = 0;
            }
        }
        
        // Ejecutar el batch final si quedan documentos
        if (contador > 0) {
            await batch.commit();
        }
        
        console.log(`      ✨ Ejercicios de categoría ${categoriaId} migrados`);
    } catch (error) {
        console.error(`      ❌ Error migrando ejercicios de categoría ${categoriaId}:`, error);
        // No lanzar error para no detener la migración completa
    }
}

/**
 * Migra el perfil del usuario
 * @param {string} userBasePath - Ruta base del usuario
 */
async function migrarPerfil(userBasePath) {
    try {
        // Leer perfil de la ruta antigua
        const perfilRaizRef = doc(db, 'usuarios', 'mi_perfil');
        const perfilSnap = await getDoc(perfilRaizRef);
        
        if (!perfilSnap.exists()) {
            console.log('   ⚠️ No hay perfil para migrar');
            return;
        }
        
        const datosPerfil = perfilSnap.data();
        
        // Crear referencia al nuevo documento
        const nuevoPerfilRef = doc(db, `${userBasePath}/perfil/datos`);
        
        // Copiar el documento
        await setDoc(nuevoPerfilRef, datosPerfil);
        
        console.log('   ✨ Perfil migrado exitosamente');
    } catch (error) {
        console.error('   ❌ Error migrando perfil:', error);
        throw error;
    }
}

/**
 * Migra las subcolecciones de ejercicios dentro de cada entreno
 * @returns {Promise<void>}
 */
export async function migrarSubcoleccionesEntrenos() {
    try {
        // 1. Verificar que el usuario sea "edgar" (por seguridad)
        const usuarioActual = obtenerUsuarioActual();
        if (usuarioActual !== 'edgar') {
            throw new Error('La migración solo puede ejecutarse con el usuario "edgar"');
        }

        console.log('🚀 Iniciando migración de subcolecciones de ejercicios en entrenos...');
        
        const userId = usuarioActual;
        const userBasePath = `usuarios/${userId}`;
        
        // 2. Obtener todos los documentos de la colección raíz pública 'entrenos'
        const entrenosRaiz = collection(db, 'entrenos');
        const entrenosSnapshot = await getDocs(entrenosRaiz);
        
        if (entrenosSnapshot.empty) {
            console.log('⚠️ No hay entrenos para migrar');
            return;
        }
        
        console.log(`📦 Encontrados ${entrenosSnapshot.size} entrenos para migrar`);
        
        // 3. Iterar sobre cada entreno
        for (const entrenoDoc of entrenosSnapshot.docs) {
            const entrenoId = entrenoDoc.id;
            console.log(`📋 Migrando ejercicios de entreno: ${entrenoId}`);
            
            // 4. Obtener la subcolección 'ejercicios' (ruta antigua: entrenos/{id}/ejercicios)
            const ejerciciosRaiz = collection(db, `entrenos/${entrenoId}/ejercicios`);
            const ejerciciosSnapshot = await getDocs(ejerciciosRaiz);
            
            if (ejerciciosSnapshot.empty) {
                console.log(`   ⚠️ No hay ejercicios en el entreno ${entrenoId}`);
                continue;
            }
            
            console.log(`   📄 Encontrados ${ejerciciosSnapshot.size} ejercicios en el entreno ${entrenoId}`);
            
            // 5. Crear batch para escrituras masivas
            let batch = writeBatch(db);
            let contador = 0;
            const BATCH_LIMIT = 500;
            
            // Ruta destino: usuarios/edgar/entrenos/{id}/ejercicios
            const rutaDestino = `${userBasePath}/entrenos/${entrenoId}/ejercicios`;
            
            // 6. Copiar cada ejercicio a la nueva ruta privada
            for (const ejercicioDoc of ejerciciosSnapshot.docs) {
                const datosEjercicio = ejercicioDoc.data();
                const ejercicioId = ejercicioDoc.id;
                
                // Crear referencia al nuevo documento
                const nuevoEjercicioRef = doc(db, rutaDestino, ejercicioId);
                
                // Agregar al batch
                batch.set(nuevoEjercicioRef, datosEjercicio);
                contador++;
                
                // Si llegamos al límite del batch, ejecutar y crear uno nuevo
                if (contador >= BATCH_LIMIT) {
                    await batch.commit();
                    console.log(`   ✅ Migrados ${contador} ejercicios del entreno ${entrenoId}`);
                    batch = writeBatch(db); // Crear nuevo batch
                    contador = 0;
                }
            }
            
            // Ejecutar el batch final si quedan documentos
            if (contador > 0) {
                await batch.commit();
                console.log(`   ✅ Migrados ${contador} ejercicios restantes del entreno ${entrenoId}`);
            }
            
            console.log(`   ✨ Ejercicios del entreno ${entrenoId} migrados completamente`);
        }
        
        console.log('✅ Migración de subcolecciones de ejercicios completada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error durante la migración de subcolecciones:', error);
        throw error;
    }
}

