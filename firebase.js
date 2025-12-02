// firebase.js
import admin from "firebase-admin";

// --- Load service account JSON string from Railway ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// --- Correct Firebase Storage bucket name ---
const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

// Debug
console.log("Using bucket:", bucketName);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: bucketName,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { admin, db, bucket };
