// Importar funciones desde las URL del CDN de Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { 
    getFirestore, 
    enableIndexedDbPersistence,
    disableNetwork,
    enableNetwork,
    waitForPendingWrites
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Exportar funciones de red para control offline
export { disableNetwork, enableNetwork, waitForPendingWrites };



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



// SILENCIAR ERRORES ESPERADOS DE FIREBASE CUANDO ESTÁ OFFLINE

// Estos errores son normales cuando la app está offline - Firebase intenta reconectar automáticamente

(function() {

    // Guardar referencias originales

    const originalError = console.error;

    const originalWarn = console.warn;

    

    // Patrones de errores esperados cuando está offline

    const offlineErrorPatterns = [

        /ERR_INTERNET_DISCONNECTED/i,

        /net::ERR_INTERNET_DISCONNECTED/i,

        /WebChannelConnection.*transport errored/i,

        /firestore\.googleapis\.com.*ERR_INTERNET_DISCONNECTED/i,

        /cleardot\.gif.*ERR_INTERNET_DISCONNECTED/i,

        /Failed to fetch/i,

        /Network request failed/i

    ];

    

    // Función para verificar si un mensaje es un error offline esperado

    function isOfflineError(message) {

        if (!message) return false;

        const messageStr = typeof message === 'string' ? message : String(message);
        
        return offlineErrorPatterns.some(pattern => pattern.test(messageStr));
    }

    

    // Interceptar console.error

    console.error = function(...args) {

        // Verificar si es un error offline esperado

        const firstArg = args[0];

        if (isOfflineError(firstArg)) {

            // Silenciar este error - es esperado cuando está offline

            return;

        }

        // Mostrar otros errores normalmente

        originalError.apply(console, args);

    };

    

    // Interceptar console.warn para errores de Firebase offline

    console.warn = function(...args) {

        const firstArg = args[0];

        // Silenciar warnings de WebChannelConnection cuando está offline

        if (typeof firstArg === 'string' && firstArg.includes('WebChannelConnection') && firstArg.includes('transport errored')) {

            return;

        }

        // Mostrar otros warnings normalmente

        originalWarn.apply(console, args);

    };

})();

