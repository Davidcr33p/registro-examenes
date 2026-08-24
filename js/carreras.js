import { db } from "./firebase.js?v=20260824142307";
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

const carrerasRef = collection(db, "carreras");

export function escucharCarreras(callback) {
  const q = query(carrerasRef, orderBy("nombre"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function crearCarrera(nombre) {
  return addDoc(carrerasRef, { nombre, materias: [] });
}

export function agregarMateria(carreraId, materia) {
  return updateDoc(doc(db, "carreras", carreraId), { materias: arrayUnion(materia) });
}

export function quitarMateria(carreraId, materia) {
  return updateDoc(doc(db, "carreras", carreraId), { materias: arrayRemove(materia) });
}

export function eliminarCarrera(carreraId) {
  return deleteDoc(doc(db, "carreras", carreraId));
}
