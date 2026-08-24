import { firebaseConfig } from "./firebase-config.js?v=20260824150859";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(firebaseConfig);

// Redes escolares/corporativas suelen tener proxies o firewalls que
// bloquean o rompen la conexión de streaming que usa Firestore por
// default (WebChannel), aunque el resto del tráfico normal sí pase.
// experimentalAutoDetectLongPolling hace que el SDK detecte esto solo y
// use long-polling en su lugar, sin penalizar redes donde sí funciona
// el streaming normal.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});
export const auth = getAuth(app);
