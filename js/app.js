import { db, auth } from "./firebase.js?v=20260824145545";
import { DOMINIO_INSTITUCIONAL } from "./auth-config.js?v=20260824145545";
import {
  registrarMaestro,
  iniciarSesion,
  cerrarSesion,
  reenviarVerificacion,
  obtenerPerfilMaestro,
  esAdmin,
  alCambiarSesion
} from "./auth.js?v=20260824145545";
import { escucharAcademias } from "./academias.js?v=20260824145545";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
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
const signupAcademia = document.getElementById("signup-academia");
const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
const btnReenviar = document.getElementById("btn-reenviar");
const btnYaVerifique = document.getElementById("btn-ya-verifique");
const btnSalirVerificacion = document.getElementById("btn-salir-verificacion");
const mensajeVerificacion = document.getElementById("mensaje-verificacion");
const hintDominio = document.getElementById("hint-dominio");

hintDominio.textContent = `Debe terminar en ${DOMINIO_INSTITUCIONAL}`;

// --- App: tabla de exámenes ---
const tablaRegistrosEl = document.querySelector(".tabla-registros");
const avisoAdmin = document.getElementById("aviso-admin");
const tbody = document.getElementById("tabla-registros-body");
const filtroPeriodo = document.getElementById("filtro-periodo");
const filtroAcademia = document.getElementById("filtro-academia");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroEstado = document.getElementById("filtro-estado");
const contador = document.getElementById("contador-registros");
const estadoConexion = document.getElementById("estado-conexion");

let registros = [];
let academias = [];
let perfilActual = null;
let esAdminActual = false;
let desuscribirRegistros = null;
let periodoActualConfig = null;
let filtroPeriodoInicializado = false;

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

// --- Catálogo de academias: alimenta el select del registro de cuenta y el filtro ---
escucharAcademias((lista) => {
  academias = lista;

  const valorSignup = signupAcademia.value;
  signupAcademia.innerHTML =
    '<option value="" disabled selected>Selecciona tu academia</option>' +
    academias.map((a) => `<option value="${a.id}">${escapeHtml(a.nombre)}</option>`).join("");
  if (academias.some((a) => a.id === valorSignup)) signupAcademia.value = valorSignup;

  const valorFiltro = filtroAcademia.value;
  filtroAcademia.innerHTML =
    '<option value="">Todas las academias</option>' +
    academias.map((a) => `<option value="${escapeHtml(a.nombre)}">${escapeHtml(a.nombre)}</option>`).join("");
  filtroAcademia.value = valorFiltro;
});

// --- Crear cuenta ---
formSignup.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensajeSignup.textContent = "";
  const nombre = document.getElementById("signup-nombre").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const academiaId = signupAcademia.value;
  const password = document.getElementById("signup-password").value;
  const password2 = document.getElementById("signup-password2").value;

  if (password !== password2) {
    mensajeSignup.textContent = "Las contraseñas no coinciden.";
    return;
  }
  const academia = academias.find((a) => a.id === academiaId);
  if (!academia) {
    mensajeSignup.textContent = "Selecciona tu academia.";
    return;
  }

  try {
    await registrarMaestro({ nombre, email, password, academiaId, academiaNombre: academia.nombre });
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
    await mostrarVistaApp();
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
  await mostrarVistaApp();
});

function ocultarTodo() {
  vistaAuth.classList.add("oculto");
  vistaVerificacion.classList.add("oculto");
  vistaApp.classList.add("oculto");
}

async function mostrarVistaApp() {
  ocultarTodo();
  vistaApp.classList.remove("oculto");
  barraSesion.classList.remove("oculto");

  tablaRegistrosEl.classList.toggle("solo-lectura", esAdminActual);
  avisoAdmin.classList.toggle("oculto", !esAdminActual);

  if (esAdminActual) {
    textoSesion.textContent = `${perfilActual?.nombre || "Cuenta"} — Administrador`;
  } else if (perfilActual) {
    textoSesion.textContent = `${perfilActual.nombre} — ${perfilActual.academiaNombre}`;
  }

  if (!periodoActualConfig) await cargarPeriodoActual();
  iniciarEscuchaRegistros();
}

async function cargarPeriodoActual() {
  try {
    const snap = await getDoc(doc(db, "config", "estado"));
    periodoActualConfig = snap.exists() ? snap.data().periodoActual : null;
  } catch (err) {
    console.error(err);
  }
}

// --- Tabla de exámenes (en tiempo real) ---
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
      actualizarFiltroPeriodo();
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

function actualizarFiltroPeriodo() {
  const periodos = [...new Set(registros.map((r) => r.periodo).filter(Boolean))].sort().reverse();
  const valorActual = filtroPeriodo.value;
  filtroPeriodo.innerHTML =
    '<option value="">Todos los periodos</option>' +
    periodos.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");

  if (!filtroPeriodoInicializado) {
    filtroPeriodoInicializado = true;
    if (periodoActualConfig && periodos.includes(periodoActualConfig)) {
      filtroPeriodo.value = periodoActualConfig;
    }
  } else if (periodos.includes(valorActual)) {
    filtroPeriodo.value = valorActual;
  }
}

function mostrarError(err) {
  console.error(err);
  estadoConexion.textContent =
    "No se pudo conectar con Firebase. Revisa js/firebase-config.js y las reglas de Firestore (ver README.md).";
}

async function marcarEntregado(id, entregadoActual) {
  const nuevoEstado = !entregadoActual;
  const ref = doc(db, "registros", id);
  await updateDoc(ref, {
    entregado: nuevoEstado,
    fechaEntrega: nuevoEstado ? serverTimestamp() : null,
    maestroId: nuevoEstado ? auth.currentUser.uid : null,
    maestroNombre: nuevoEstado ? perfilActual?.nombre || null : null
  });
}

function formatearFecha(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "—";
  return timestamp.toDate().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function render() {
  const periodo = filtroPeriodo.value;
  const academia = filtroAcademia.value;
  const tipo = filtroTipo.value;
  const estado = filtroEstado.value;

  const filtrados = registros.filter((r) => {
    if (periodo && r.periodo !== periodo) return false;
    if (academia && r.academia !== academia) return false;
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
    .map((r) => {
      // Un maestro solo puede marcar entregado/pendiente en exámenes de su
      // propia academia; un admin nunca puede (su vista es de solo lectura).
      const puedeMarcar = !esAdminActual && perfilActual && r.academiaId === perfilActual.academiaId;
      const acciones = puedeMarcar
        ? `<button class="btn-toggle" data-id="${r.id}" data-entregado="${r.entregado}">
            ${r.entregado ? "Desmarcar" : "Marcar entregado"}
          </button>`
        : "";
      return `
    <tr class="${r.entregado ? "fila-entregada" : ""}">
      <td>${escapeHtml(r.academia)}</td>
      <td>${escapeHtml(r.materia)}</td>
      <td><span class="badge badge-tipo-${escapeHtml(r.tipo)}">${escapeHtml(r.tipo)}</span></td>
      <td><span class="badge ${r.entregado ? "badge-entregado" : "badge-pendiente"}">${
        r.entregado ? "Entregado" : "Pendiente"
      }</span></td>
      <td>${formatearFecha(r.fechaEntrega)}</td>
      <td class="acciones">${acciones}</td>
    </tr>
  `;
    })
    .join("");

  contador.textContent = `${filtrados.length} de ${registros.length} registro(s)`;
}

tbody.addEventListener("click", (e) => {
  const btnToggle = e.target.closest(".btn-toggle");
  if (btnToggle) marcarEntregado(btnToggle.dataset.id, btnToggle.dataset.entregado === "true");
});

[filtroPeriodo, filtroAcademia, filtroTipo, filtroEstado].forEach((el) => el.addEventListener("change", render));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
