# Registro de Exámenes

Registro de exámenes por carrera técnica y materia — Escuela Técnica Álvaro Obregón Monterrey I.

Cada maestro se registra con su **correo institucional** y su **carrera**. Al crear un registro solo ve las **materias de su propia carrera**, elige el **tipo de examen (A o B)**, y cuando lo marca como entregado se guarda automáticamente la **fecha y hora** (no se escribe a mano). La tabla muestra primero los **pendientes** y hasta abajo los **entregados**. Los datos viven en una base de datos compartida (Firebase Firestore + Authentication), en tiempo real, para que cualquier maestro pueda entrar desde cualquier dispositivo.

Las cuentas marcadas como **administrador** (colección `admins`, ver más abajo) ven una versión de solo lectura: sin formulario de nuevo registro y sin botones de marcar entregado/eliminar, solo la tabla completa de todas las carreras — pensado para que alguien pueda monitorear a quién le falta entregar sin poder alterar los datos desde la interfaz.

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
js/auth-config.js         Dominio de correo institucional permitido (ya está completado)
firestore.rules            Reglas de seguridad de Firestore (versionadas, se despliegan con la CLI)
firebase.json / .firebaserc Configuración de la Firebase CLI para este proyecto
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

Entra a `admin.html` (no requiere sesión iniciada, a propósito — ver más abajo) y ahí puedes:

- Agregar una carrera.
- Agregar/quitar las materias que le pertenecen a esa carrera.

Ese catálogo es lo que alimenta: el selector de carrera al crear una cuenta, el selector de materia al registrar un examen (filtrado según la carrera del maestro), y el filtro de carreras en la tabla.

## 4. Reglas de Firestore

Las reglas viven versionadas en [`firestore.rules`](firestore.rules) y se despliegan con la Firebase CLI (ya autenticada en esta máquina):

```
firebase deploy --only firestore:rules --project registro-examenes-eiao
```

Resumen de qué protege cada colección:

- **`carreras`** (nombres de carreras/materias): lectura y escritura abiertas a propósito, sin requerir sesión. Es la única forma de romper el problema del huevo y la gallina — para crear una cuenta hace falta elegir una carrera de la lista, así que tiene que ser posible cargar la primera carrera antes de que exista ningún maestro registrado. No son datos sensibles (solo nombres de carrera/materia), así que dejarlo abierto es un riesgo bajo para un uso interno de escuela.
- **`registros`** (los exámenes): requieren sesión iniciada para leer o escribir.
- **`maestros`** (perfiles): cada quien solo puede escribir su propio perfil.
- **`admins`** (quién ve la vista de solo lectura): un documento por UID. Se agrega/quita a mano — la app no tiene una pantalla para esto. Para agregar un admin hace falta que esa persona ya se haya registrado como maestro (para tener un UID), y luego crear el documento `admins/{uid}` directamente en Firestore.

Si más adelante se quiere blindar esto a nivel de reglas (que un admin literalmente no pueda escribir en `registros` aunque llame a la API directo, no solo que la interfaz no se lo permita), se puede agregar — avísame cuando haga falta.

## 5. Probar localmente

Al ser módulos de JavaScript (`type="module"`), el navegador no los carga si abres los `.html` directo con doble clic (protocolo `file://`). Usa un servidor local, por ejemplo:

```
npx serve .
```

y abre la URL que te indique (normalmente `http://localhost:3000`).

## 6. Publicar (GitHub Pages)

El repositorio ya está conectado a GitHub Pages — cualquier cambio subido a la rama `main` se refleja automáticamente en la URL pública del sitio.

GitHub Pages sirve los archivos con `Cache-Control: max-age=600` (10 minutos) — un navegador puede quedarse hasta 10 min con una copia vieja de un `.css`/`.js` después de cada deploy. Para que eso nunca pase, un **git hook** (`.githooks/pre-commit`) sincroniza automáticamente el `?v=...` de cada `<link>`, `<script src>` e import entre módulos JS a un mismo timestamp, cada vez que un commit toca `.html`/`.css`/`.js` del sitio — no hay que acordarse de subir números a mano. Para que el hook funcione en un clon nuevo del repo, hay que activarlo una vez:

```
git config core.hooksPath .githooks
```

(Ya está activado en esta máquina.)

## Próximos pasos sugeridos

- Cargar el catálogo real de carreras y materias desde `admin.html`.
- Definir un rol de administrador si se quiere restringir quién edita el catálogo.
- Exportar el registro a Excel/CSV si se requiere para reportes.
