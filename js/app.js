import { db, auth } from "./firebase.js?v=20260824142307";
import { DOMINIO_INSTITUCIONAL } from "./auth-config.js?v=20260824142307";
import {
  registrarMaestro,
  iniciarSesion,
  cerrarSesion,
  reenviarVerificacion,
  obtenerPerfilMaestro,
  esAdmin,
  alCambiarSesion
} from "./auth.js?v=20260824142307";
import { escucharCarreras } from "./carreras.js?v=20260824142307";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const registrosRef = collection(db, "registros");

// --- Vistas ---
const vistaAuth = document.getElementById("vista-auth");
const vistaVerificacion = document.getElementById("vista-verificacion");
const vistaApp = document.getElementById("vista-app");
const barraSesion = document.getElementById("barra-sesion");
const textoSesion = document.getElementById("texto-sesion");

// --- Auth: login/signup ---
const tabsAuth = document.querySelectorAll(".tab-auth");
const formLogin = document.getElementById("form-login");
const formSignup = document.getElementById("form-signup");
const mensajeLogin = document.getElementById("mensaje-login");
const mensajeSignup = document.getElementById("mensaje-signup");
const signupCarrera = document.getElementById("signup-carrera");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
const btnReenviar = document.getElementById("btn-reenviar");
const btnYaVerifique = document.getElementById("btn-ya-verifique");
const btnSalirVerificacion = document.getElementById("btn-salir-verificacion");
const mensajeVerificacion = document.getElementById("mensaje-verificacion");
const hintDominio = document.getElementById("hint-dominio");

hintDominio.textContent = `Debe terminar en ${DOMINIO_INSTITUCIONAL}`;

// --- App: formulario y tabla ---
const contenedorApp = document.querySelector("#vista-app.contenedor");
const panelForm = document.querySelector(".panel-form");
const tablaRegistrosEl = document.querySelector(".tabla-registros");
const avisoAdmin = document.getElementById("aviso-admin");
const form = document.getElementById("form-registro");
const carreraActualEl = document.getElementById("carrera-actual");
const selectMateria = document.getElementById("select-materia");
const selectTipo = document.getElementById("select-tipo");
const tbody = document.getElementById("tabla-registros-body");
const filtroCarrera = document.getElementById("filtro-carrera");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroEstado = document.getElementById("filtro-estado");
const contador = document.getElementById("contador-registros");
const estadoConexion = document.getElementById("estado-conexion");

let registros = [];
let carreras = [];
let perfilActual = null;
let esAdminActual = false;
let desuscribirRegistros = null;

// --- Tabs login / crear cuenta ---
tabsAuth.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabsAuth.forEach((t) => t.classList.remove("activo"));
    tab.classList.add("activo");
    const esLogin = tab.dataset.tab === "login";
    formLogin.classList.toggle("oculto", !esLogin);
    formSignup.classList.toggle("oculto", esLogin);
  });
});

// --- Catálogo de carreras: alimenta el select del registro y los filtros ---
escucharCarreras((lista) => {
  carreras = lista;

  const valorSignup = signupCarrera.value;
  signupCarrera.innerHTML =
    '<option value="" disabled selected>Selecciona tu carrera</option>' +
    carreras.map((c) => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join("");
  if (carreras.some((c) => c.id === valorSignup)) signupCarrera.value = valorSignup;

  const valorFiltro = filtroCarrera.value;
  filtroCarrera.innerHTML =
    '<option value="">Todas las carreras</option>' +
    carreras.map((c) => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join("");
  filtroCarrera.value = valorFiltro;

  actualizarSelectMateria();
});

function actualizarSelectMateria() {
  if (!perfilActual) return;
  const carrera = carreras.find((c) => c.id === perfilActual.carreraId);
  const materias = carrera ? carrera.materias || [] : [];
  const valorActual = selectMateria.value;
  selectMateria.innerHTML =
    '<option value="" disabled selected>Selecciona una materia</option>' +
    materias.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  if (materias.includes(valorActual)) selectMateria.value = valorActual;
}

// --- Crear cuenta ---
formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeSignup.textContent = "";
  const nombre = document.getElementById("signup-nombre").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const carreraId = signupCarrera.value;
  const password = document.getElementById("signup-password").value;
  const password2 = document.getElementById("signup-password2").value;

  if (password !== password2) {
    mensajeSignup.textContent = "Las contraseñas no coinciden.";
    return;
  }
  const carrera = carreras.find((c) => c.id === carreraId);
  if (!carrera) {
    mensajeSignup.textContent = "Selecciona tu carrera.";
    return;
  }

  try {
    await registrarMaestro({ nombre, email, password, carreraId, carreraNombre: carrera.nombre });
  } catch (err) {
    mensajeSignup.textContent = traducirErrorAuth(err);
  }
});

// --- Iniciar sesión ---
formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeLogin.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await iniciarSesion(email, password);
  } catch (err) {
    mensajeLogin.textContent = traducirErrorAuth(err);
  }
});

btnCerrarSesion.addEventListener("click", () => cerrarSesion());
btnSalirVerificacion.addEventListener("click", () => cerrarSesion());

btnReenviar.addEventListener("click", async () => {
  await reenviarVerificacion();
  mensajeVerificacion.textContent = "Correo reenviado.";
});

btnYaVerifique.addEventListener("click", async () => {
  await auth.currentUser.reload();
  if (auth.currentUser.emailVerified) {
    perfilActual = await obtenerPerfilMaestro(auth.currentUser.uid);
    esAdminActual = await esAdmin(auth.currentUser.uid);
    mostrarVistaApp();
  } else {
    mensajeVerificacion.textContent = "Todavía no detectamos la verificación. Revisa tu correo (y spam).";
  }
});

function traducirErrorAuth(err) {
  const codigo = err.code || "";
  if (codigo.includes("email-already-in-use")) return "Ese correo ya tiene una cuenta.";
  if (codigo.includes("invalid-email")) return "Correo inválido.";
  if (codigo.includes("weak-password")) return "La contraseña debe tener al menos 6 caracteres.";
  if (
    codigo.includes("user-not-found") ||
    codigo.includes("wrong-password") ||
    codigo.includes("invalid-credential")
  )
    return "Correo o contraseña incorrectos.";
  return err.message || "Ocurrió un error.";
}

// --- Cambios de sesión: controla qué vista se muestra ---
alCambiarSesion(async (user) => {
  ocultarTodo();
  if (!user) {
    vistaAuth.classList.remove("oculto");
    barraSesion.classList.add("oculto");
    perfilActual = null;
    detenerEscuchaRegistros();
    return;
  }
  if (!user.emailVerified) {
    vistaVerificacion.classList.remove("oculto");
    barraSesion.classList.add("oculto");
    detenerEscuchaRegistros();
    return;
  }
  perfilActual = await obtenerPerfilMaestro(user.uid);
  esAdminActual = await esAdmin(user.uid);
  mostrarVistaApp();
});

function ocultarTodo() {
  vistaAuth.classList.add("oculto");
  vistaVerificacion.classList.add("oculto");
  vistaApp.classList.add("oculto");
}

function mostrarVistaApp() {
  ocultarTodo();
  vistaApp.classList.remove("oculto");
  barraSesion.classList.remove("oculto");
  iniciarEscuchaRegistros();

  contenedorApp.classList.toggle("solo-lectura", esAdminActual);
  panelForm.classList.toggle("oculto", esAdminActual);
  tablaRegistrosEl.classList.toggle("solo-lectura", esAdminActual);
  avisoAdmin.classList.toggle("oculto", !esAdminActual);

  if (esAdminActual) {
    textoSesion.textContent = `${perfilActual?.nombre || "Cuenta"} — Administrador`;
  } else if (perfilActual) {
    textoSesion.textContent = `${perfilActual.nombre} — ${perfilActual.carreraNombre}`;
    carreraActualEl.textContent = perfilActual.carreraNombre;
    actualizarSelectMateria();
  }
}

// --- Nuevo registro ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!perfilActual || !auth.currentUser || esAdminActual) return;
  const materia = selectMateria.value;
  const tipo = selectTipo.value;
  if (!materia || !tipo) return;

  try {
    await addDoc(registrosRef, {
      carrera: perfilActual.carreraNombre,
      carreraId: perfilActual.carreraId,
      materia,
      tipo,
      entregado: false,
      fechaEntrega: null,
      creadoEn: serverTimestamp(),
      maestroId: auth.currentUser.uid,
      maestroNombre: perfilActual.nombre
    });
    form.reset();
  } catch (err) {
    mostrarError(err);
  }
});

// --- Tabla de registros (en tiempo real) ---
// Se suscribe solo después de confirmar sesión iniciada (mostrarVistaApp),
// nunca antes: las reglas de Firestore exigen estar logueado para leer
// `registros`, así que suscribirse antes de tiempo (ej. justo al cargar la
// página, mientras el SDK de Auth todavía está restaurando la sesión)
// producía un error de permisos que no se reintentaba solo hasta recargar.
function iniciarEscuchaRegistros() {
  if (desuscribirRegistros) return;
  const q = query(registrosRef, orderBy("creadoEn", "desc"));
  desuscribirRegistros = onSnapshot(
    q,
    (snapshot) => {
      estadoConexion.textContent = "";
      registros = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (err) => mostrarError(err)
  );
}

function detenerEscuchaRegistros() {
  if (desuscribirRegistros) {
    desuscribirRegistros();
    desuscribirRegistros = null;
  }
  registros = [];
}

function mostrarError(err) {
  console.error(err);
  estadoConexion.textContent =
    "No se pudo conectar con Firebase. Revisa js/firebase-config.js y las reglas de Firestore (ver README.md).";
}

async function marcarEntregado(id, entregadoActual) {
  const ref = doc(db, "registros", id);
  await updateDoc(ref, {
    entregado: !entregadoActual,
    fechaEntrega: !entregadoActual ? serverTimestamp() : null
  });
}

async function eliminarRegistro(id) {
  if (!confirm("¿Eliminar este registro?")) return;
  await deleteDoc(doc(db, "registros", id));
}

function formatearFecha(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "—";
  return timestamp.toDate().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function render() {
  const carrera = filtroCarrera.value;
  const tipo = filtroTipo.value;
  const estado = filtroEstado.value;

  const filtrados = registros.filter((r) => {
    if (carrera && r.carrera !== carrera) return false;
    if (tipo && r.tipo !== tipo) return false;
    if (estado === "entregado" && !r.entregado) return false;
    if (estado === "pendiente" && r.entregado) return false;
    return true;
  });

  // Pendientes arriba, entregados abajo. Como `registros` ya viene ordenado
  // por fecha de creación (desc) desde Firestore, un sort estable por
  // "entregado" conserva ese orden dentro de cada grupo.
  const ordenados = [...filtrados].sort((a, b) => Number(a.entregado) - Number(b.entregado));

  tbody.innerHTML = ordenados
    .map(
      (r) => `
    <tr class="${r.entregado ? "fila-entregada" : ""}">
      <td>${escapeHtml(r.carrera)}</td>
      <td>${escapeHtml(r.materia)}</td>
      <td><span class="badge badge-tipo-${escapeHtml(r.tipo)}">${escapeHtml(r.tipo)}</span></td>
      <td><span class="badge ${r.entregado ? "badge-entregado" : "badge-pendiente"}">${
        r.entregado ? "Entregado" : "Pendiente"
      }</span></td>
      <td>${formatearFecha(r.fechaEntrega)}</td>
      <td class="acciones">
        <button class="btn-toggle" data-id="${r.id}" data-entregado="${r.entregado}">
          ${r.entregado ? "Desmarcar" : "Marcar entregado"}
        </button>
        <button class="btn-eliminar" data-id="${r.id}" title="Eliminar registro">✕</button>
      </td>
    </tr>
  `
    )
    .join("");

  contador.textContent = `${filtrados.length} de ${registros.length} registro(s)`;
}

tbody.addEventListener("click", (e) => {
  if (esAdminActual) return;
  const btnToggle = e.target.closest(".btn-toggle");
  const btnEliminar = e.target.closest(".btn-eliminar");
  if (btnToggle) marcarEntregado(btnToggle.dataset.id, btnToggle.dataset.entregado === "true");
  if (btnEliminar) eliminarRegistro(btnEliminar.dataset.id);
});

[filtroCarrera, filtroTipo, filtroEstado].forEach((el) => el.addEventListener("change", render));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
