# Registro de Exámenes

Registro de exámenes por carrera técnica y materia — Escuela Técnica Álvaro Obregón Monterrey Uno.

Cada registro guarda: **carrera**, **materia**, **tipo de examen (A o B)** y, cuando se marca como entregado, la **fecha y hora de entrega** (se guarda automáticamente, no se escribe a mano). Los datos se guardan en una base de datos compartida (Firebase Firestore) para que se puedan ver y actualizar desde cualquier dispositivo, en tiempo real.

## Estructura del proyecto

```
index.html          Página principal
css/styles.css       Estilos
js/app.js             Lógica de la app (formulario, tabla, filtros, Firestore)
js/firebase-config.js Configuración de tu proyecto de Firebase (hay que completarla)
```

## 1. Crear el proyecto de Firebase (una sola vez)

1. Entra a https://console.firebase.google.com y crea un proyecto nuevo (puedes desactivar Google Analytics, no se usa aquí).
2. Dentro del proyecto, ve a **Compilación > Firestore Database** y crea una base de datos:
   - Modo: empieza en **modo de prueba** (test mode) para configurar rápido; más abajo están las reglas recomendadas para reemplazar después.
   - Ubicación: elige una región cercana (por ejemplo `us-central` o `southamerica-east1`).
3. Ve a **Configuración del proyecto** (ícono de engrane) > pestaña **Tus apps** > **Agregar app > Web (`</>`)**.
4. Registra la app (no necesitas Firebase Hosting). Copia el objeto `firebaseConfig` que te muestra.
5. Pega esos valores en [`js/firebase-config.js`](js/firebase-config.js), reemplazando los `TU_...`.

La `apiKey` de Firebase para apps web **no es secreta** — el acceso real se controla con las reglas de Firestore del paso siguiente, así que es seguro subir este archivo al repositorio.

## 2. Reglas de Firestore (recomendado antes de usarla en serio)

En **Firestore Database > Reglas**, reemplaza el modo de prueba (que expira en 30 días) por algo así, para permitir lectura/escritura solo de la colección `registros`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registros/{registroId} {
      allow read, write: if true;
    }
  }
}
```

Esto deja el registro abierto a cualquiera que tenga el link (suficiente para empezar, uso interno). Si más adelante quieres que solo el personal autorizado pueda editar, se puede agregar Firebase Authentication y restringir `write` a usuarios logueados — se puede hacer cuando haga falta.

## 3. Probar localmente

Al ser módulos de JavaScript (`type="module"`), el navegador no los carga si abres `index.html` directo con doble clic (protocolo `file://`). Usa un servidor local, por ejemplo:

```
npx serve .
```

y abre la URL que te indique (normalmente `http://localhost:3000`).

## 4. Publicar (GitHub Pages)

El repositorio ya está conectado a GitHub Pages — cualquier cambio subido a la rama `main` se refleja automáticamente en la URL pública del sitio.

## Próximos pasos sugeridos

- Cargar las carreras y materias reales (se agregan solas al `datalist` conforme las vayas registrando desde el formulario).
- Si se necesita, agregar inicio de sesión para limitar quién puede marcar entregas.
- Exportar el registro a Excel/CSV si se requiere para reportes.
