const express = require("express");
const connectDB = require("./db/connectDB");
const routes = require('./routes/routes');
const cors = require('cors');
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const messageController = require('./controllers/chatControllers/messageController'); 

const PORT = 5000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());
app.use('/api', routes);

// Socket.io connection setup
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("message", async (data) => {
    const { username, message, channel } = data;
    console.log(`Message received: ${message} from ${username} in ${channel}`);
    await messageController.saveMessage(username, message, channel);
    io.emit("message", { username, message, channel });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
  } catch (err) {
    console.log(err);
  }
};

start();

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
