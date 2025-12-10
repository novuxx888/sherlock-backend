# Sherlock Backend

Backend server for the Sherlock smart home monitoring system. Handles image uploads, device communication via WebSocket, and Firebase integration.

## Features

- **Image Upload**: Receive and store images from Raspberry Pi camera to Firebase Storage
- **WebSocket Server**: Real-time bidirectional communication with Raspberry Pi
- **Firebase Integration**: Firestore for data persistence and Storage for images
- **Authentication**: Firebase Auth token verification
- **Command Relay**: Send commands from frontend to connected Pi devices

## Tech Stack

- **Node.js** with ES6 modules
- **Express.js** - Web framework
- **WebSocket (ws)** - Real-time communication
- **Firebase Admin SDK** - Backend Firebase services
- **Multer** - Multipart file uploads
- **CORS** - Cross-origin resource sharing

## Prerequisites

- Node.js (v14 or higher)
- Firebase project with:
  - Firestore database
  - Firebase Storage
  - Service account credentials

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
FIREBASE_SERVICE_ACCOUNT=<your-firebase-service-account-json>
FIREBASE_STORAGE_BUCKET=<your-bucket-name>.appspot.com
PORT=8080
```

3. Place your Firebase service account key in `firebase-key.json` (or configure via environment variable)

## Running the Server

### Development
```bash
node server.js
```

### Production (Heroku/Railway)
The `Procfile` is configured for deployment:
```
web: node server.js
```

## API Endpoints

### POST `/api/upload-image`
Upload an image file to Firebase Storage.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: Image file (JPEG)

**Response:**
```json
{
  "success": true,
  "url": "https://firebasestorage.googleapis.com/..."
}
```

### POST `/send-command`
Send a command to connected Raspberry Pi.

**Request:**
```json
{
  "token": "<firebase-auth-token>",
  "command": "capture"
}
```

**Response:**
```json
{
  "ok": true,
  "sent": "capture"
}
```

## WebSocket Protocol

### Client Connection
Connect to `ws://your-server:8080`

### Pi Device Registration
Send: `"hello-from-pi"`

This registers the WebSocket connection as the Pi device and updates Firestore with online status.

### Message Logging
All messages from the Pi are automatically logged to Firestore `logs` collection.

## Project Structure

```
sherlock-backend/
├── server.js              # Main server file
├── firebase.js            # Firebase Admin initialization
├── firebase-key.json      # Service account credentials
├── package.json           # Dependencies
├── Procfile              # Deployment configuration
└── routes/
    └── uploadImage.js    # Image upload route handler
```

## Firebase Collections

### `captures`
Stores uploaded image metadata:
- `url`: Public Firebase Storage URL
- `storagePath`: Storage file path
- `createdAt`: Server timestamp

### `devices`
Tracks connected device status:
- `status`: "online" | "offline"
- `lastPing`: ISO timestamp

### `logs`
Device message logs:
- `from`: Device identifier
- `message`: Log message
- `timestamp`: Server timestamp

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON string of service account | `{"type":"service_account",...}` |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket name | `my-project.appspot.com` |
| `PORT` | Server port | `8080` |

## Deployment

This project is configured for deployment on platforms like Railway or Heroku. Ensure environment variables are properly set in your deployment platform.

## License

ISC
