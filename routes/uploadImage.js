import express from "express";
import multer from "multer";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Multer stores file in memory
const upload = multer({ storage: multer.memoryStorage() });

// -----------------------------------------------------
// POST /api/upload-image   <-- MUST MATCH PI
// -----------------------------------------------------
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const filename = `captures/${Date.now()}_${uuidv4()}.jpg`;

    const token = uuidv4();
    const fileUpload = bucket.file(filename);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    // Correct Firebase public URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      filename
    )}?alt=media&token=${token}`;

    // Store Firestore doc
    await db.collection("captures").add({
      url: publicUrl,
      storagePath: filename,
      token,
      createdAt: new Date(),
    });

    return res.json({ ok: true, url: publicUrl });

  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
