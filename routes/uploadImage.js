// routes/uploadImage.js
import express from "express";
import multer from "multer";
import { bucket, db, admin } from "../firebase.js";

const router = express.Router();

// Multer to read file upload
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file sent." });
    }

    // File path in Firebase Storage
    const filename = `captures/${Date.now()}_capture.jpg`;

    // Upload to Firebase Storage
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: Date.now().toString(),
        },
      },
    });

    // Force-update metadata so token is available
    const [metadata] = await file.getMetadata();
    const token = metadata.metadata.firebaseStorageDownloadTokens;

    // Construct Firebase-native download URL
    const downloadURL =
      `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/` +
      `${encodeURIComponent(filename)}?alt=media&token=${token}`;

    // Save Firestore entry
    const docRef = await db.collection("captures").add({
      storagePath: filename,
      downloadURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({
      success: true,
      id: docRef.id,
      storagePath: filename,
      downloadURL,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.toString() });
  }
});

export default router;
