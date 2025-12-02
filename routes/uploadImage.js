// routes/uploadImage.js
import express from "express";
import { bucket, db } from "../firebase.js";
import admin from "firebase-admin";
import fs from "fs";

const router = express.Router();

// Make sure Express can read JSON bodies
router.use(express.json());

router.post("/upload-image", async (req, res) => {
  try {
    const { imagePath, filename } = req.body;

    if (!imagePath || !filename) {
      return res.status(400).json({ error: "Missing imagePath or filename" });
    }

    console.log("📤 Uploading from Pi:", imagePath);
    console.log("➡️ Storing as:", `captures/${filename}`);

    // Verify file exists before upload
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Pi file not found" });
    }

    await bucket.upload(imagePath, {
      destination: `captures/${filename}`,
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          firebaseStorageDownloadTokens: filename
        }
      }
    });

    const publicUrl =
      `https://storage.googleapis.com/${bucket.name}/captures/${filename}`;

    console.log("✅ Uploaded to:", publicUrl);

    // Save Firestore document
    await db.collection("captures").add({
      filename,
      storagePath: `captures/${filename}`,
      url: publicUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true, url: publicUrl });

  } catch (err) {
    console.error("❌ Upload failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
