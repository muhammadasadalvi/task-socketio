const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo()(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;
app.use(cors());
// Store messages for each room
const messageHistory = {};

io.on("connection", (socket) => {
  console.log("User Connected!");

  socket.on("joinRoom", (room) => {
    socket.join(room);
    if (!messageHistory[room]) {
      messageHistory[room] = [];
    }
    socket.emit("messageHistory", messageHistory[room]);
    socket.broadcast
      .to(room)
      .emit("notification", "A new user has joined the room.");
  });

  socket.on("sendMessage", (data) => {
    const { room, message } = data;
    const { username } = socket;
    const newMessage = { username, message, timestamp: new Date().getTime() };
    messageHistory[room].push(newMessage);
    if (messageHistory[room].length > 10) {
      messageHistory[room].shift();
    }
    io.to(room).emit("message", newMessage);
  });

  socket.on("sendPrivateMessage", (data) => {
    const { to, message } = data;
    const { username } = socket;
    const privateMessage = {
      from: username,
      message,
      timestamp: new Date().getTime(),
    };
    io.to(to).emit("privateMessage", privateMessage);
  });

  socket.on("typing", (room) => {
    socket.broadcast.to(room).emit("typing", socket.username);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    socket.broadcast.emit("notification", "A user has left the room.");
  });
});
app.use(cors({ origin: "locahost:3001" }));
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
