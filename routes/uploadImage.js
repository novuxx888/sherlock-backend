import express from "express";
import multer from "multer";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Multer handles file uploads
const upload = multer({ storage: multer.memoryStorage() });

// ------------------------------
// POST /api/upload-image
// ------------------------------
router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    // no req.body.imagePath anymore!
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const filename = `captures/${Date.now()}_${uuidv4()}.jpg`;

    // Upload to Firebase Storage
    const fileUpload = bucket.file(filename);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    // Generate public download URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Store metadata in Firestore
    await db.collection("captures").add({
      url: publicUrl,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      url: publicUrl,
    });

  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
