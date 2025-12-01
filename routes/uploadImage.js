import express from "express";
import multer from "multer";
import { bucket } from "../firebase.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-image", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const filename = `pi_images/${Date.now()}-${uuidv4()}.jpg`;

    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });

    blobStream.on("finish", async () => {
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ ok: true, url: publicUrl });
    });

    blobStream.end(file.buffer);

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
