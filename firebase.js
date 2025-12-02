import admin from "firebase-admin";
import fs from "fs";

// Read JSON manually (Railway-safe)
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "smart-home-dashboard-dce4b.appspot.com" // ← your bucket
});

export const db = admin.firestore();
export const storageBucket = admin.storage().bucket();
