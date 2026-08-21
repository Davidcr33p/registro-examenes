import { escucharCarreras, crearCarrera, agregarMateria, quitarMateria, eliminarCarrera } from "./carreras.js?v=20260821164644";

const vistaCargando = document.getElementById("vista-admin-cargando");
const vistaAdmin = document.getElementById("vista-admin");
const formNuevaCarrera = document.getElementById("form-nueva-carrera");
const inputNuevaCarrera = document.getElementById("input-nueva-carrera");
const listaCarrerasAdmin = document.getElementById("lista-carreras-admin");

// El catálogo de carreras/materias es de acceso abierto (ver firestore.rules)
// a propósito: así se puede cargar la primera carrera antes de que exista
// ninguna cuenta de maestro, sin depender de haber iniciado sesión.
vistaCargando.classList.add("oculto");
vistaAdmin.classList.remove("oculto");

formNuevaCarrera.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = inputNuevaCarrera.value.trim();
  if (!nombre) return;
  await crearCarrera(nombre);
  formNuevaCarrera.reset();
});

escucharCarreras((carreras) => {
  listaCarrerasAdmin.innerHTML = carreras
    .map(
      (c) => `
    <article class="tarjeta-carrera">
      <div class="tarjeta-carrera-header">
        <h3>${escapeHtml(c.nombre)}</h3>
        <button class="btn-eliminar btn-eliminar-carrera" data-id="${c.id}" title="Eliminar carrera">✕</button>
      </div>
      <ul class="lista-materias">
        ${(c.materias || [])
          .map(
            (m) => `<li>${escapeHtml(m)} <button class="btn-quitar-materia" data-id="${c.id}" data-materia="${escapeHtml(
              m
            )}">✕</button></li>`
          )
          .join("") || '<li class="lista-materias-vacia">Sin materias todavía</li>'}
      </ul>
      <form class="form-nueva-materia" data-id="${c.id}">
        <input type="text" placeholder="Nueva materia" required>
        <button type="submit" class="btn-secundario">Agregar</button>
      </form>
    </article>
  `
    )
    .join("");
});

listaCarrerasAdmin.addEventListener("submit", async (e) => {
  const form = e.target.closest(".form-nueva-materia");
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector("input");
  const materia = input.value.trim();
  if (!materia) return;
  await agregarMateria(form.dataset.id, materia);
  form.reset();
});

listaCarrerasAdmin.addEventListener("click", async (e) => {
  const btnQuitar = e.target.closest(".btn-quitar-materia");
  const btnEliminarCarrera = e.target.closest(".btn-eliminar-carrera");
  if (btnQuitar) {
    await quitarMateria(btnQuitar.dataset.id, btnQuitar.dataset.materia);
  }
  if (btnEliminarCarrera) {
    if (confirm("¿Eliminar esta carrera y todas sus materias del catálogo?")) {
      await eliminarCarrera(btnEliminarCarrera.dataset.id);
    }
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
