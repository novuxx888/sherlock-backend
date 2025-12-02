// routes/uploadImage.js
import express from "express";
import fs from "fs";
import { bucket, db } from "../firebase.js";
import admin from "firebase-admin";

const router = express.Router();

router.post("/upload-image", async (req, res) => {
  try {
    const { imagePath, filename } = req.body;

    if (!imagePath || !filename) {
      return res.status(400).json({ error: "Missing imagePath or filename" });
    }

    console.log("Uploading:", filename);

    // Upload to Firebase Storage
    await bucket.upload(imagePath, {
      destination: `captures/${filename}`,
      metadata: {
        contentType: "image/jpeg",
      },
    });

    const publicUrl =
      `https://storage.googleapis.com/${bucket.name}/captures/${filename}`;

    // Save Firestore record
    await db.collection("captures").add({
      filename,
      url: publicUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ ok: true, url: publicUrl });

  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
