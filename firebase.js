// firebase.js
import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName  // <-- IMPORTANT
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { admin, db, bucket };
