# Registro de Exámenes

Seguimiento de entrega de exámenes por academia y materia — Escuela Técnica Álvaro Obregón Monterrey I.

Los exámenes **no los crea cada maestro**: se precargan por periodo (ej. "Agosto-Diciembre 2026"), uno Tipo A y uno Tipo B por cada materia de cada academia, desde `admin.html` (ver sección 3). Cada maestro se registra con su **correo institucional** y su **academia**, y solo puede marcar como **entregado/pendiente** los exámenes de su propia academia — el resto de la tabla la puede ver (todas las academias, filtrable) pero no tocar. Al marcar entregado se guarda automáticamente **quién y cuándo** (no se escribe a mano). La tabla muestra primero los **pendientes** y hasta abajo los **entregados**. Los datos viven en una base de datos compartida (Firebase Firestore + Authentication), en tiempo real, para que cualquier maestro pueda entrar desde cualquier dispositivo.

Las cuentas marcadas como **administrador** (colección `admins`, ver sección 4) ven una versión de solo lectura de la tabla — sin botones de marcar entregado, solo la tabla completa de todas las academias — pensado para que alguien pueda monitorear a quién le falta entregar sin poder alterar los datos desde la interfaz. Los admins son también los únicos que pueden generar un nuevo periodo de exámenes desde `admin.html`.

## Estructura del proyecto

```
index.html            Login / crear cuenta / verificación / tabla de exámenes
admin.html             Panel para administrar academias/materias y generar periodos de examen
css/styles.css          Estilos
js/app.js                Lógica de la página principal (sesión, tabla, filtros, marcar entregado)
js/admin.js              Lógica del panel de administración (catálogo + generar periodo)
js/auth.js                Registro, login, logout, verificación de correo, chequeo de admin
js/academias.js           Lectura/escritura del catálogo de academias y materias
js/firebase.js            Inicializa Firebase (app, Firestore, Auth) para todo el sitio
js/firebase-config.js     Configuración de tu proyecto de Firebase (ya está completada)
js/auth-config.js         Dominio de correo institucional permitido (ya está completado)
firestore.rules            Reglas de seguridad de Firestore (versionadas, se despliegan con la CLI)
firebase.json / .firebaserc Configuración de la Firebase CLI para este proyecto
scripts/seed-academias.mjs  Script que cargó el catálogo real de 18 academias técnicas (re-ejecutable)
```

## 1. Firebase — Firestore y Authentication

Firestore ya está creado y configurado (`js/firebase-config.js` tiene tus datos reales). Falta activar **Authentication**:

1. En Firebase Console, ve a **Compilación > Authentication > Get started**.
2. En la pestaña **Sign-in method**, activa el proveedor **Correo electrónico/contraseña** (Email/Password).
3. Ve a **Authentication > Settings > Authorized domains** y agrega `davidcr33p.github.io` (para que los links de verificación de correo funcionen bien en el sitio publicado).

**Nota sobre redes escolares/corporativas:** Firestore usa por default una conexión de streaming (WebChannel) que algunos firewalls o proxies de redes institucionales bloquean o interfieren, aunque el resto de la página cargue normal — típicamente se ve como "No se pudo conectar con Firebase" justo al intentar guardar algo. `js/firebase.js` ya inicializa Firestore con `experimentalAutoDetectLongPolling: true`, que detecta esto solo y cambia a long-polling (más compatible, sin penalizar redes donde el streaming normal sí funciona).

## 2. Dominio de correo institucional

Ya configurado en [`js/auth-config.js`](js/auth-config.js):

```js
export const DOMINIO_INSTITUCIONAL = "@uanl.edu.mx";
```

Esto se usa para validar, al momento de crear una cuenta, que el correo termine en ese dominio. **Ojo:** esta validación es del lado del navegador (no bloquea a alguien que llame a la API de Firebase directamente con otro correo). Para un uso interno de escuela es suficiente; si más adelante se necesita blindarlo del todo, se puede agregar una Cloud Function que revise el dominio al crear la cuenta y la bloquee — es un paso más avanzado, se puede hacer cuando haga falta.

## 3. Catálogo de academias/materias y generar un periodo de exámenes

Entra a `admin.html` (el catálogo de academias/materias no requiere sesión iniciada, a propósito — ver sección 4) y ahí puedes:

- Agregar una academia y sus materias (esto alimenta el selector de academia al crear una cuenta, y el nombre de academia que se guarda en cada examen).
- **Generar un periodo de exámenes**: escribe un nombre de periodo (ej. "Agosto-Diciembre 2026") y presiona "Generar exámenes" — crea un examen Tipo A y uno Tipo B por cada materia de cada academia del catálogo actual, listos para marcarse como entregados. Si vuelves a correrlo con el mismo nombre de periodo, no duplica lo que ya existía (solo agrega lo que falte, por ejemplo si agregaste una materia nueva después). **Esto requiere estar logueado con una cuenta de administrador** (ver sección 4) — si no, esa sección de la página no aparece.
- Cada vez que generas un periodo, queda marcado como el "periodo activo" (`config/estado.periodoActual`), que es el que la tabla principal muestra por default (se puede cambiar a "todos los periodos" o a uno anterior desde el filtro).

**Pendiente/limitación conocida:** las materias del catálogo no están separadas por semestre — el catálogo actual (18 academias técnicas) trae *todas* las materias de los 6 semestres de cada carrera juntas, así que "generar periodo" crea exámenes para materias que en la realidad no se cursan ese semestre específico. Si se necesita que solo se generen las materias del semestre que le toca a cada periodo, hay que re-cargar el catálogo con la materia etiquetada por semestre — avísame cuando haga falta.

## 4. Administradores

Un admin ve la tabla de exámenes en modo solo lectura (todas las academias, sin poder marcar nada) y es quien puede generar periodos de examen desde `admin.html`. Se administra directo en la colección `admins` de Firestore — un documento por UID, la app no tiene pantalla para esto. Para agregar un admin, esa persona debe haberse registrado primero como maestro (para tener un UID), y luego hay que crear el documento `admins/{uid}` a mano en Firestore.

## 5. Reglas de Firestore

Las reglas viven versionadas en [`firestore.rules`](firestore.rules) y se despliegan con la Firebase CLI (ya autenticada en esta máquina):

```
firebase deploy --only firestore:rules --project registro-examenes-eiao
```

Resumen de qué protege cada colección:

- **`academias`** (nombres de academias/materias): lectura y escritura abiertas a propósito, sin requerir sesión. Es la única forma de romper el problema del huevo y la gallina — para crear una cuenta hace falta elegir una academia de la lista, así que tiene que ser posible cargar la primera academia antes de que exista ningún maestro registrado. No son datos sensibles (solo nombres), así que dejarlo abierto es un riesgo bajo para un uso interno de escuela.
- **`registros`** (los exámenes): cualquier maestro logueado puede leerlos y actualizarlos (marcar entregado/pendiente); solo un admin puede crearlos o borrarlos (es la acción masiva de "generar periodo").
- **`maestros`** (perfiles): cada quien solo puede escribir su propio perfil.
- **`admins`** (quién ve la vista de solo lectura y puede generar periodos): un documento por UID, se administra a mano (ver sección 4).
- **`config`** (ej. periodo activo): lectura para cualquier maestro logueado, escritura solo para admins.

Si más adelante se quiere que un maestro literalmente no pueda escribir en un examen que no es de su academia (no solo que la interfaz no se lo permita), se puede agregar a nivel de reglas — avísame cuando haga falta.

## 6. Probar localmente

Al ser módulos de JavaScript (`type="module"`), el navegador no los carga si abres los `.html` directo con doble clic (protocolo `file://`). Usa un servidor local, por ejemplo:

```
npx serve .
```

y abre la URL que te indique (normalmente `http://localhost:3000`).

## 7. Publicar (GitHub Pages)

El repositorio ya está conectado a GitHub Pages — cualquier cambio subido a la rama `main` se refleja automáticamente en la URL pública del sitio.

GitHub Pages sirve los archivos con `Cache-Control: max-age=600` (10 minutos) — un navegador puede quedarse hasta 10 min con una copia vieja de un `.css`/`.js` después de cada deploy. Para que eso nunca pase, un **git hook** (`.githooks/pre-commit`) sincroniza automáticamente el `?v=...` de cada `<link>`, `<script src>` e import entre módulos JS a un mismo timestamp, cada vez que un commit toca `.html`/`.css`/`.js` del sitio — no hay que acordarse de subir números a mano. Para que el hook funcione en un clon nuevo del repo, hay que activarlo una vez:

```
git config core.hooksPath .githooks
```

(Ya está activado en esta máquina.)

## Próximos pasos sugeridos

- Etiquetar las materias del catálogo por semestre, para que "generar periodo" solo cree exámenes de las materias que realmente se cursan ese periodo (ver sección 3).
- Cargar las academias de Tronco Común (matemáticas, inglés, orientación, etc.) — pendiente de que llegue la agrupación real por academia.
- Exportar el registro a Excel/CSV si se requiere para reportes.
