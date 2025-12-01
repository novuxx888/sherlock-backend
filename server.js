import express from "express";
import cors from "cors";
import fs from "fs";
import http from "http";
import { WebSocketServer } from "ws";
import uploadImageRoute from "./routes/uploadImage.js";
import admin from "firebase-admin";

// -------------------------------
// Firebase Admin Initialization
// -------------------------------
const serviceAccount = JSON.parse(
  fs.readFileSync("./firebase-key.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "<your-project-id>.appspot.com"
});

const db = admin.firestore();

// -------------------------------
// Express HTTP Server
// -------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Register your upload-image route
app.use("/api", uploadImageRoute);

// Create actual HTTP server (required for WS)
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

    // -------------------------------------
    // 1. If this is the Pi connecting
    // -------------------------------------
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

    // -------------------------------------
    // 2. Messages from the Pi
    // -------------------------------------
    if (ws === piSocket) {
      await db.collection("logs").add({
        from: "pi",
        message: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // -------------------------------------
    // 3. Messages from other clients
    // -------------------------------------
    await db.collection("logs").add({
      from: "client",
      message: msg,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  });
});

// -------------------------------
// Start HTTP + WebSocket Server
// -------------------------------
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`HTTP+WS server running on port ${PORT}`);
});
