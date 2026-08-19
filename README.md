# Registro de Exámenes

Registro de exámenes por carrera técnica y materia — Escuela Técnica Álvaro Obregón Monterrey Uno.

Cada maestro se registra con su **correo institucional** y su **carrera**. Al crear un registro solo ve las **materias de su propia carrera**, elige el **tipo de examen (A o B)**, y cuando lo marca como entregado se guarda automáticamente la **fecha y hora** (no se escribe a mano). La tabla muestra primero los **pendientes** y hasta abajo los **entregados**. Los datos viven en una base de datos compartida (Firebase Firestore + Authentication), en tiempo real, para que cualquier maestro pueda entrar desde cualquier dispositivo.

## Estructura del proyecto

```
index.html            Login / crear cuenta / verificación / formulario y tabla de registros
admin.html             Panel para administrar el catálogo de carreras y materias
css/styles.css          Estilos
js/app.js                Lógica de la página principal (sesión, formulario, tabla, filtros)
js/admin.js              Lógica del panel de administración de carreras/materias
js/auth.js                Registro, login, logout, verificación de correo
js/carreras.js            Lectura/escritura del catálogo de carreras y materias
js/firebase.js            Inicializa Firebase (app, Firestore, Auth) para todo el sitio
js/firebase-config.js     Configuración de tu proyecto de Firebase (ya está completada)
js/auth-config.js         Dominio de correo institucional permitido (hay que completarlo)
```

## 1. Firebase — Firestore y Authentication

Firestore ya está creado y configurado (`js/firebase-config.js` tiene tus datos reales). Falta activar **Authentication**:

1. En Firebase Console, ve a **Compilación > Authentication > Get started**.
2. En la pestaña **Sign-in method**, activa el proveedor **Correo electrónico/contraseña** (Email/Password).
3. Ve a **Authentication > Settings > Authorized domains** y agrega `davidcr33p.github.io` (para que los links de verificación de correo funcionen bien en el sitio publicado).

## 2. Dominio de correo institucional

Edita [`js/auth-config.js`](js/auth-config.js) y reemplaza el valor de ejemplo por el dominio real de la escuela:

```js
export const DOMINIO_INSTITUCIONAL = "@tu-escuela.edu.mx";
```

Esto se usa para validar, al momento de crear una cuenta, que el correo termine en ese dominio. **Ojo:** esta validación es del lado del navegador (no bloquea a alguien que llame a la API de Firebase directamente con otro correo). Para un uso interno de escuela es suficiente; si más adelante se necesita blindarlo del todo, se puede agregar una Cloud Function que revise el dominio al crear la cuenta y la bloquee — es un paso más avanzado, se puede hacer cuando haga falta.

## 3. Cargar el catálogo de carreras y materias

Entra a `admin.html` (con cualquier cuenta ya verificada) y ahí puedes:

- Agregar una carrera.
- Agregar/quitar las materias que le pertenecen a esa carrera.

Ese catálogo es lo que alimenta: el selector de carrera al crear una cuenta, el selector de materia al registrar un examen (filtrado según la carrera del maestro), y el filtro de carreras en la tabla.

## 4. Reglas de Firestore (recomendado)

En **Firestore Database > Reglas**, reemplaza el modo de prueba (expira 30 días después de creado) por esto, que exige estar logueado para leer o escribir:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registros/{registroId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.maestroId == request.auth.uid;
      allow update, delete: if request.auth != null;
    }
    match /carreras/{carreraId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /maestros/{maestroId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == maestroId;
    }
  }
}
```

Con esto cualquier maestro logueado puede administrar el catálogo de carreras/materias (no hay todavía un rol de "administrador" separado). Si más adelante quieres que solo tú puedas editar el catálogo, se puede agregar un rol de administrador (custom claims) — avísame cuando lo necesites.

## 5. Probar localmente

Al ser módulos de JavaScript (`type="module"`), el navegador no los carga si abres los `.html` directo con doble clic (protocolo `file://`). Usa un servidor local, por ejemplo:

```
npx serve .
```

y abre la URL que te indique (normalmente `http://localhost:3000`).

## 6. Publicar (GitHub Pages)

El repositorio ya está conectado a GitHub Pages — cualquier cambio subido a la rama `main` se refleja automáticamente en la URL pública del sitio.

## Próximos pasos sugeridos

- Cargar el catálogo real de carreras y materias desde `admin.html`.
- Definir un rol de administrador si se quiere restringir quién edita el catálogo.
- Exportar el registro a Excel/CSV si se requiere para reportes.
