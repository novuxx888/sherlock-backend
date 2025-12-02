// server.js
console.log("Using bucket:", process.env.FIREBASE_STORAGE_BUCKET);

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import uploadImageRoute from "./routes/uploadImage.js";
import { admin, db } from "./firebase.js";

const app = express();
app.use(cors());
app.use(express.json());

// File upload endpoint
app.use("/api", uploadImageRoute);

// WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let piSocket = null;

wss.on("connection", (ws) => {
  console.log("WS connected");

  ws.on("message", async (msgBuffer) => {
    const msg = msgBuffer.toString();
    console.log("Received:", msg);

    if (msg === "hello-from-pi") {
      piSocket = ws;

      await db.collection("devices").doc("pi").set({
        status: "online",
        lastPing: new Date().toISOString()
      }, { merge: true });

      return;
    }

    if (ws === piSocket) {
      await db.collection("logs").add({
        from: "pi",
        message: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }
  });
});

// Frontend → Backend → Pi
app.post("/send-command", async (req, res) => {
  const { token, command } = req.body;

  if (!token || !command)
    return res.status(400).json({ error: "Missing token or command" });

  try {
    await admin.auth().verifyIdToken(token);

    if (!piSocket)
      return res.status(500).json({ error: "Pi not connected" });

    piSocket.send(command);

    return res.json({ ok: true, sent: command });

  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Backend running on ${PORT}`));
