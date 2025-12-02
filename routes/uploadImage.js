import express from "express";
import multer from "multer";
import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// temp folder for receiving Pi image
const upload = multer({ dest: "/tmp" });

router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const localPath = req.file.path;
    const fileName = `captures/${uuidv4()}.jpg`;
    const bucket = storageBucket;

    await bucket.upload(localPath, {
      destination: fileName,
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
    });

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

    // Save metadata to Firestore
    await admin.firestore().collection("captures").add({
      url: downloadUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: "raspberry-pi-01",
    });

    return res.json({
      success: true,
      url: downloadUrl,
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
