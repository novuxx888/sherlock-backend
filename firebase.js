import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "smart-home-dashboard-dce4b.appspot.com" // <-- your bucket
});

export const db = admin.firestore();
export const storageBucket = admin.storage().bucket();
