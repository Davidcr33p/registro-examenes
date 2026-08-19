import { auth, db } from "./firebase.js";
import { DOMINIO_INSTITUCIONAL } from "./auth-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function emailValido(email) {
  return email.toLowerCase().trim().endsWith(DOMINIO_INSTITUCIONAL.toLowerCase());
}

export async function registrarMaestro({ nombre, email, password, carreraId, carreraNombre }) {
  const correo = email.trim();
  if (!emailValido(correo)) {
    throw new Error(`Usa tu correo institucional (${DOMINIO_INSTITUCIONAL}).`);
  }
  const cred = await createUserWithEmailAndPassword(auth, correo, password);
  await updateProfile(cred.user, { displayName: nombre });
  await setDoc(doc(db, "maestros", cred.user.uid), {
    nombre,
    email: correo,
    carreraId,
    carreraNombre
  });
  await sendEmailVerification(cred.user);
  return cred.user;
}

export function iniciarSesion(email, password) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function cerrarSesion() {
  return signOut(auth);
}

export function reenviarVerificacion() {
  if (auth.currentUser) return sendEmailVerification(auth.currentUser);
}

export async function obtenerPerfilMaestro(uid) {
  const snap = await getDoc(doc(db, "maestros", uid));
  return snap.exists() ? snap.data() : null;
}

export function alCambiarSesion(callback) {
  return onAuthStateChanged(auth, callback);
}
