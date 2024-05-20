const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");
require("dotenv").config();

const app = express();

// Middleware setup
app.use(cors());
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
const server = app.listen(process.env.PORT || 5000, () =>
  console.log(`Server started on port ${process.env.PORT || 5000}`)
);

// Socket.IO setup
const io = socket(server, {
  cors: {
    origin: process.env.ORIGIN, // Update this with your client URL
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
