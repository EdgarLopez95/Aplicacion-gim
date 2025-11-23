// Importar funciones desde las URL del CDN de Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";



// Tu configuración de Firebase

const firebaseConfig = {

  apiKey: "AIzaSyCJJfYZ7Fqu3mulHLmsEvLgOoY43fsjXxc",

  authDomain: "aplicacion-gim-d3e48.firebaseapp.com",

  projectId: "aplicacion-gim-d3e48",

  storageBucket: "aplicacion-gim-d3e48.firebasestorage.app",

  messagingSenderId: "841378700142",

  appId: "1:841378700142:web:4c9923cab39b796b2eff7f"

};



// Inicializar Firebase

const app = initializeApp(firebaseConfig);



// Exportar las instancias de los servicios para que otros módulos las usen

export const db = getFirestore(app);

export const storage = getStorage(app);



// ACTIVAR PERSISTENCIA OFFLINE (IndexedDB)

// Esto permite que la app funcione sin conexión y cargue instantáneamente desde caché

enableIndexedDbPersistence(db)

    .then(() => {

        console.log('✅ Persistencia offline activada. La app funcionará sin conexión.');

    })

    .catch((err) => {

        if (err.code == 'failed-precondition') {

            // Múltiples pestañas abiertas, solo una puede tener persistencia habilitada

            console.warn('⚠️ La persistencia falló: Probablemente múltiples pestañas abiertas. Solo una pestaña puede tener persistencia activa.');

        } else if (err.code == 'unimplemented') {

            // El navegador no soporta persistencia (muy raro en navegadores modernos)

            console.warn('⚠️ El navegador no soporta persistencia offline.');

        } else {

            console.error('❌ Error al activar persistencia offline:', err);

        }

    });

