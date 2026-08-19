import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const registrosRef = collection(db, "registros");

const form = document.getElementById("form-registro");
const inputCarrera = document.getElementById("input-carrera");
const inputMateria = document.getElementById("input-materia");
const selectTipo = document.getElementById("select-tipo");
const tbody = document.getElementById("tabla-registros-body");
const datalistCarreras = document.getElementById("lista-carreras");
const datalistMaterias = document.getElementById("lista-materias");
const filtroCarrera = document.getElementById("filtro-carrera");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroEstado = document.getElementById("filtro-estado");
const contador = document.getElementById("contador-registros");
const estadoConexion = document.getElementById("estado-conexion");

let registros = [];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const carrera = inputCarrera.value.trim();
  const materia = inputMateria.value.trim();
  const tipo = selectTipo.value;
  if (!carrera || !materia || !tipo) return;

  try {
    await addDoc(registrosRef, {
      carrera,
      materia,
      tipo,
      entregado: false,
      fechaEntrega: null,
      creadoEn: serverTimestamp()
    });
    form.reset();
    inputCarrera.focus();
  } catch (err) {
    mostrarError(err);
  }
});

const q = query(registrosRef, orderBy("creadoEn", "desc"));
onSnapshot(
  q,
  (snapshot) => {
    estadoConexion.textContent = "";
    registros = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    actualizarFiltros();
    render();
  },
  (err) => mostrarError(err)
);

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
  return timestamp.toDate().toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function actualizarFiltros() {
  const carrerasUnicas = [...new Set(registros.map((r) => r.carrera))].sort();
  const materiasUnicas = [...new Set(registros.map((r) => r.materia))].sort();

  datalistCarreras.innerHTML = carrerasUnicas
    .map((c) => `<option value="${escapeHtml(c)}">`)
    .join("");
  datalistMaterias.innerHTML = materiasUnicas
    .map((m) => `<option value="${escapeHtml(m)}">`)
    .join("");

  const valorActual = filtroCarrera.value;
  filtroCarrera.innerHTML =
    '<option value="">Todas las carreras</option>' +
    carrerasUnicas.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  filtroCarrera.value = carrerasUnicas.includes(valorActual) ? valorActual : "";
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

  tbody.innerHTML = filtrados
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
  const btnToggle = e.target.closest(".btn-toggle");
  const btnEliminar = e.target.closest(".btn-eliminar");
  if (btnToggle) {
    marcarEntregado(btnToggle.dataset.id, btnToggle.dataset.entregado === "true");
  }
  if (btnEliminar) {
    eliminarRegistro(btnEliminar.dataset.id);
  }
});

[filtroCarrera, filtroTipo, filtroEstado].forEach((el) => el.addEventListener("change", render));

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
