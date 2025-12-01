import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import uploadImageRoute from "./routes/uploadImage.js";
import { db } from "./firebase.js";  // << ONLY import, no initialize
import admin from "firebase-admin";

// -------------------------------
// Express HTTP Server
// -------------------------------
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadImageRoute);

// Create actual HTTP server (needed for WS)
const server = http.createServer(app);

// -------------------------------
// WebSocket Server
// -------------------------------
const wss = new WebSocketServer({ server });

let piSocket = null;

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", async (msgBuffer) => {
    const msg = msgBuffer.toString();
    console.log("Received:", msg);

    // Pi identifies itself
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

    // Messages from Pi
    if (ws === piSocket) {
      await db.collection("logs").add({
        from: "pi",
        message: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Messages from Web App
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

// -------------------------------
// Start HTTP + WebSocket Server
// -------------------------------
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`HTTP+WS server running on port ${PORT}`);
});
