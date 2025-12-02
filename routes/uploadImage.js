import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import admin from "firebase-admin";

const router = express.Router();

// store uploaded images in memory, not disk
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image received" });
    }

    const bucket = admin.storage().bucket();
    const filename = `captures/${uuidv4()}.jpg`;
    const file = bucket.file(filename);

    // Upload buffer to Firebase Storage
    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      public: true,           // make image viewable directly
      resumable: false
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Write Firestore record
    await admin.firestore().collection("captures").add({
      url: publicUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ ok: true, url: publicUrl });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
