import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync("./firebase-key.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "smart-home-dashboard-dce4b.appspot.com"
});

export const bucket = admin.storage().bucket();
