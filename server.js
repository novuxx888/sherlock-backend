import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import uploadImageRoute from "./routes/uploadImage.js";
import admin from "firebase-admin";

// -------------------------------
// Firebase Admin Initialization
// -------------------------------
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET
});

const db = admin.firestore();

// -------------------------------
// Express HTTP Server
// -------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", uploadImageRoute);

// Create actual HTTP server (required for WebSocket)
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

    // 1. Identify Pi connection
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

    // 2. If message is from the Pi
    if (ws === piSocket) {
      await db.collection("logs").add({
        from: "pi",
        message: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // 3. Messages from clients (your web app)
    await db.collection("logs").add({
      from: "client",
      message: msg,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Forward client command to Pi
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
