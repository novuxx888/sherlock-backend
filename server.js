console.log("Using bucket:", process.env.FIREBASE_STORAGE_BUCKET);

import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import uploadImageRoute from "./routes/uploadImage.js";
import { db } from "./firebase.js"; 
import admin from "firebase-admin";

// -------------------------------
// Express HTTP Server
// -------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Upload route
app.use("/api", uploadImageRoute);


// ------------------------------------------------
// ❌ PUBLIC TEST ROUTE (COMMENTED OUT FOR SECURITY)
// ------------------------------------------------
// app.get("/test/:cmd", (req, res) => {
//   const cmd = req.params.cmd;
//
//   if (!piSocket) {
//     return res.status(500).json({ error: "Pi not connected" });
//   }
//
//   piSocket.send(cmd);
//   res.json({ sent: cmd });
// });


// -------------------------------
// WebSocket Server
// -------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let piSocket = null;

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", async (msgBuffer) => {
    const msg = msgBuffer.toString();
    console.log("Received:", msg);

    // ----------------------------------
    // Pi identifies itself
    // ----------------------------------
    if (msg === "hello-from-pi") {
      piSocket = ws;

      await db.collection("logs").add({
        from: "pi",
        message: "connected",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      await db.collection("devices")
        .doc("raspberry-pi-01")
        .set(
          {
            status: "online",
            lastPing: new Date().toISOString()
          },
          { merge: true }
        );

      return;
    }

    // ----------------------------------
    // Messages from the Pi
    // ----------------------------------
    if (ws === piSocket) {
      await db.collection("logs").add({
        from: "pi",
        message: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // ----------------------------------
    // Messages from other clients
    // ----------------------------------
    await db.collection("logs").add({
      from: "client",
      message: msg,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    if (piSocket) {
      piSocket.send(msg);
    }
  });
});

// ------------------------------------------------------------
// 🔒 SECURE COMMAND ROUTE — FRONTEND MUST SEND FIREBASE TOKEN
// ------------------------------------------------------------
app.post("/send-command", async (req, res) => {
  const { command, token } = req.body;

  if (!token || !command) {
    return res.status(400).json({ error: "Missing token or command" });
  }

  try {
    // 1. Verify Firebase Auth token (Google signed)
    const decoded = await admin.auth().verifyIdToken(token);

    console.log("User:", decoded.uid, "sent command:", command);

    // OPTIONAL — restrict access:
    // if (decoded.uid !== "<YOUR-UID>") return res.status(403).json({ error: "Forbidden" });

    // 2. Ensure Pi is online
    if (!piSocket) {
      return res.status(500).json({ error: "Pi not connected" });
    }

    // 3. Send command to Pi
    piSocket.send(command);

    return res.json({ ok: true, sent: command });

  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
});


// -------------------------------
// Start HTTP + WS Server
// -------------------------------
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`HTTP+WS server running on port ${PORT}`);
});
