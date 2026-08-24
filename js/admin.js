import { db, auth } from "./firebase.js?v=20260824150859";
import { alCambiarSesion, esAdmin } from "./auth.js?v=20260824150859";
import {
  escucharAcademias,
  crearAcademia,
  agregarMateria,
  quitarMateria,
  eliminarAcademia
} from "./academias.js?v=20260824150859";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const vistaCargando = document.getElementById("vista-admin-cargando");
const vistaAdmin = document.getElementById("vista-admin");
const formNuevaAcademia = document.getElementById("form-nueva-academia");
const inputNuevaAcademia = document.getElementById("input-nueva-academia");
const listaAcademiasAdmin = document.getElementById("lista-academias-admin");

const seccionPeriodo = document.getElementById("seccion-periodo");
const avisoSinAdmin = document.getElementById("aviso-sin-admin");
const formGenerarPeriodo = document.getElementById("form-generar-periodo");
const inputPeriodo = document.getElementById("input-periodo");
const btnGenerarPeriodo = document.getElementById("btn-generar-periodo");
const mensajeGenerar = document.getElementById("mensaje-generar");
const periodoActualTexto = document.getElementById("periodo-actual-texto");

let academiasActuales = [];

// El catálogo de academias/materias es de acceso abierto (ver firestore.rules)
// a propósito: así se puede cargar la primera academia antes de que exista
// ninguna cuenta de maestro, sin depender de haber iniciado sesión.
vistaCargando.classList.add("oculto");
vistaAdmin.classList.remove("oculto");

// Generar un periodo de exámenes sí requiere ser admin (crea muchos
// documentos en registros/, cuya regla de creación exige admin).
alCambiarSesion(async (user) => {
  const esAdminActual = !!user && user.emailVerified && (await esAdmin(user.uid));
  seccionPeriodo.classList.toggle("oculto", !esAdminActual);
  avisoSinAdmin.classList.toggle("oculto", esAdminActual);
  if (esAdminActual) {
    try {
      const snap = await getDoc(doc(db, "config", "estado"));
      periodoActualTexto.textContent = snap.exists() && snap.data().periodoActual ? snap.data().periodoActual : "(ninguno todavía)";
    } catch (err) {
      console.error(err);
    }
  }
});

formNuevaAcademia.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = inputNuevaAcademia.value.trim();
  if (!nombre) return;
  await crearAcademia(nombre);
  formNuevaAcademia.reset();
});

const OPCIONES_SEMESTRE = [1, 2, 3, 4, 5, 6]
  .map((s) => `<option value="${s}">${s}° semestre</option>`)
  .join("");

escucharAcademias((academias) => {
  academiasActuales = academias;
  listaAcademiasAdmin.innerHTML = academias
    .map(
      (a) => `
    <article class="tarjeta-academia">
      <div class="tarjeta-academia-header">
        <h3>${escapeHtml(a.nombre)}</h3>
        <button class="btn-eliminar btn-eliminar-academia" data-id="${a.id}" title="Eliminar academia">✕</button>
      </div>
      <ul class="lista-materias">
        ${(a.materias || [])
          .slice()
          .sort((m1, m2) => m1.semestre - m2.semestre)
          .map(
            (m) => `<li>
              <span>${escapeHtml(m.nombre)} <span class="etiqueta-semestre">${m.semestre}° sem.</span></span>
              <button class="btn-quitar-materia" data-id="${a.id}" data-nombre="${escapeHtml(m.nombre)}" data-semestre="${m.semestre}">✕</button>
            </li>`
          )
          .join("") || '<li class="lista-materias-vacia">Sin materias todavía</li>'}
      </ul>
      <form class="form-nueva-materia" data-id="${a.id}">
        <input type="text" placeholder="Nueva materia" required>
        <select required>
          <option value="" disabled selected>Semestre</option>
          ${OPCIONES_SEMESTRE}
        </select>
        <button type="submit" class="btn-secundario">Agregar</button>
      </form>
    </article>
  `
    )
    .join("");
});

listaAcademiasAdmin.addEventListener("submit", async (e) => {
  const form = e.target.closest(".form-nueva-materia");
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector("input");
  const select = form.querySelector("select");
  const nombre = input.value.trim();
  const semestre = Number(select.value);
  if (!nombre || !semestre) return;
  await agregarMateria(form.dataset.id, { nombre, semestre });
  form.reset();
});

listaAcademiasAdmin.addEventListener("click", async (e) => {
  const btnQuitar = e.target.closest(".btn-quitar-materia");
  const btnEliminarAcademia = e.target.closest(".btn-eliminar-academia");
  if (btnQuitar) {
    await quitarMateria(btnQuitar.dataset.id, {
      nombre: btnQuitar.dataset.nombre,
      semestre: Number(btnQuitar.dataset.semestre)
    });
  }
  if (btnEliminarAcademia) {
    if (confirm("¿Eliminar esta academia y todas sus materias del catálogo?")) {
      await eliminarAcademia(btnEliminarAcademia.dataset.id);
    }
  }
});

// --- Generar periodo: precarga un examen Tipo A y uno Tipo B por cada
// materia de cada academia, para el periodo indicado. No duplica lo que ya
// exista para ese mismo periodo si se corre más de una vez. ---
formGenerarPeriodo.addEventListener("submit", async (e) => {
  e.preventDefault();
  const periodo = inputPeriodo.value.trim();
  if (!periodo) return;

  btnGenerarPeriodo.disabled = true;
  mensajeGenerar.textContent = "Generando…";

  try {
    const existentesSnap = await getDocs(query(collection(db, "registros"), where("periodo", "==", periodo)));
    const existentes = new Set(
      existentesSnap.docs.map((d) => {
        const f = d.data();
        return `${f.academiaId}|${f.materia}|${f.tipo}`;
      })
    );

    const nuevos = [];
    for (const academia of academiasActuales) {
      for (const materia of academia.materias || []) {
        for (const tipo of ["A", "B"]) {
          const clave = `${academia.id}|${materia.nombre}|${tipo}`;
          if (existentes.has(clave)) continue;
          nuevos.push({
            academiaId: academia.id,
            academia: academia.nombre,
            materia: materia.nombre,
            semestre: materia.semestre,
            tipo
          });
        }
      }
    }

    const TAMANO_LOTE = 450;
    for (let i = 0; i < nuevos.length; i += TAMANO_LOTE) {
      const lote = writeBatch(db);
      for (const item of nuevos.slice(i, i + TAMANO_LOTE)) {
        const ref = doc(collection(db, "registros"));
        lote.set(ref, {
          ...item,
          periodo,
          entregado: false,
          fechaEntrega: null,
          maestroId: null,
          maestroNombre: null,
          creadoEn: serverTimestamp()
        });
      }
      await lote.commit();
    }

    await setDoc(doc(db, "config", "estado"), { periodoActual: periodo }, { merge: true });
    periodoActualTexto.textContent = periodo;

    mensajeGenerar.textContent =
      nuevos.length > 0
        ? `Listo: se agregaron ${nuevos.length} exámenes nuevos para "${periodo}" (${existentes.size} ya existían y no se duplicaron). Quedó como periodo activo.`
        : `No había nada nuevo que agregar para "${periodo}" (ya estaba completo). Quedó como periodo activo.`;
  } catch (err) {
    console.error(err);
    mensajeGenerar.textContent = "Ocurrió un error generando el periodo. Revisa la consola.";
  } finally {
    btnGenerarPeriodo.disabled = false;
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
