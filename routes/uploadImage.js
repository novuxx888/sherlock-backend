import express from "express";
import { bucket, db } from "../firebase.js";
import admin from "firebase-admin";

const router = express.Router();

router.post("/upload-image", async (req, res) => {
  try {
    const { imagePath, filename } = req.body;

    if (!imagePath || !filename) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const destination = `captures/${filename}`;

    await bucket.upload(imagePath, {
      destination,
      metadata: {
        contentType: "image/jpeg",  // 🔥 FIX MIME TYPE
        metadata: {
          firebaseStorageDownloadTokens: Date.now().toString(),
        },
      },
    });

    const publicUrl =
      `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Save to Firestore
    await db.collection("captures").add({
      url: publicUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ ok: true, url: publicUrl });

  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
