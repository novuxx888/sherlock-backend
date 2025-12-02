import express from "express";
import multer from "multer";
import admin from "firebase-admin";
import { db } from "../firebase.js"; // Your shared Firestore instance

const router = express.Router();

// Multer stores file in memory (buffer) instead of filesystem
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------
// POST /api/upload-image
// ---------------------------------------------
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const bucket = admin.storage().bucket();

    // Generate filename
    const filename = `captures/capture-${Date.now()}.jpg`;

    // Upload buffer directly to Firebase Storage
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
      resumable: false,
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Save metadata to Firestore
    await db.collection("captures").add({
      url: publicUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("[UPLOAD] Saved image to Firebase:", publicUrl);

    return res.json({
      ok: true,
      url: publicUrl,
    });

  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

export default router;
