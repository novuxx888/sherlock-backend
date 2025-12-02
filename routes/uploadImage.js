// routes/uploadImage.js
import express from "express";
import multer from "multer";
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const router = express.Router();

// Multer temp storage
const upload = multer({ dest: "/tmp" });

// Upload endpoint
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const bucket = admin.storage().bucket(); // uses default bucket
    const destination = `captures/${Date.now()}-${req.file.originalname}`;

    // Upload to Firebase Storage
    await bucket.upload(req.file.path, { destination });

    // Make it public (optional)
    await bucket.file(destination).makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Clean tmp
    fs.unlinkSync(req.file.path);

    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

export default router;
