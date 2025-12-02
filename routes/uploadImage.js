import express from "express";
import multer from "multer";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const token = uuidv4();
    const filename = `captures/${Date.now()}_${uuidv4()}.jpg`;

    const fileUpload = bucket.file(filename);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    // 🔥 Correct Firebase public URL
    const publicUrl =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(filename)}?alt=media&token=${token}`;

    // Save Firestore
    await db.collection("captures").add({
      url: publicUrl,
      storagePath: filename,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      url: publicUrl,
    });

  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
