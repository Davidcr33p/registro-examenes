import { db } from "./firebase.js?v=20260824145545";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const academiasRef = collection(db, "academias");

export function escucharAcademias(callback) {
  const q = query(academiasRef, orderBy("nombre"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function crearAcademia(nombre) {
  return addDoc(academiasRef, { nombre, materias: [] });
}

export function agregarMateria(academiaId, materia) {
  return updateDoc(doc(db, "academias", academiaId), { materias: arrayUnion(materia) });
}

export function quitarMateria(academiaId, materia) {
  return updateDoc(doc(db, "academias", academiaId), { materias: arrayRemove(materia) });
}

export function eliminarAcademia(academiaId) {
  return deleteDoc(doc(db, "academias", academiaId));
}
