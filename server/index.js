const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
require("dotenv").config();

const app = express();
const ALLOWED_ORIGINS = [
  'https://664c255b9e6c50823bb16adf--kaleidoscopic-swan-570a57.netlify.app',
  'https://664bae0211b52523766c1048--sparkling-belekoy-c71609.netlify.app' // add other origins if needed
];

// Middleware setup
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connection Successful");
  })
  .catch((err) => {
    console.log("DB Connection Error: ", err.message);
  });

// Test endpoint
app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

// Route setup
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Start the server
const server = app.listen(process.env.PORT || 3000, () =>
  console.log(`Server started on port ${process.env.PORT || 3000}`)
);

// Socket.IO setup
const io = socket(server, {
  cors: {
    origin: ALLOWED_ORIGINS, // Update this with your client URLs
    credentials: true,
  },
});

// Global online users map
global.onlineUsers = new Map();

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user addition
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log("User added:", userId);
  });

  // Handle sending messages
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
      console.log("Message sent to user:", data.to);
    } else {
      console.log("User not connected:", data.to);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    for (const [key, value] of onlineUsers.entries()) {
      if (value === socket.id) {
        onlineUsers.delete(key);
        break;
      }
    }
  });
});
