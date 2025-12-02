// routes/uploadImage.js
import express from "express";
import multer from "multer";
import { bucket } from "../firebase.js";

const router = express.Router();
const upload = multer({ dest: "/tmp" });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" });

    const tempPath = req.file.path;
    const filename = `captures/${Date.now()}_${req.file.originalname}`;

    // Upload file to bucket
    await bucket.upload(tempPath, {
      destination: filename,
      contentType: req.file.mimetype,
      metadata: { firebaseStorageDownloadTokens: Date.now() }
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return res.json({ ok: true, url: publicUrl });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
