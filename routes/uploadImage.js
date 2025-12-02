// routes/uploadImage.js
import express from "express";
import { bucket, db } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Must parse raw binary
router.post("/upload", async (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: "No image data" });
    }

    const imageBuffer = req.body; // raw bytes from Raspberry Pi
    const id = uuidv4();
    const fileName = `captures/${id}.jpg`;
    const file = bucket.file(fileName);

    console.log("[BACKEND] Uploading received image...");

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/jpeg",
      },
      public: true,
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log("[BACKEND] Upload complete:", publicUrl);

    // Save metadata to Firestore
    await db.collection("captures").doc(id).set({
      id,
      fileName,
      url: publicUrl,
      timestamp: Date.now(),
    });

    res.json({
      ok: true,
      url: publicUrl,
      fileName,
    });

  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    res.status(500).json({ error: "Upload failed", details: err.toString() });
  }
});

export default router;
