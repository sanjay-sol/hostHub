const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const { Server } = require("socket.io");

const app = express();
const io = new Server({ cors: "*" });
const subscriber = new Redis(process.env.REDIS_URL);

//* Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

//* WebSocket connection
io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", JSON.stringify({ type: "joined", channel }));
  });
});

//* Redis subscription
subscriber.on("pmessage", (pattern, channel, message) => {
  io.to(channel).emit("message", message);
});

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  await subscriber.psubscribe("logs:*");
}

initRedisSubscribe().then(() => {
  io.listen(9002, () => console.log("Socket Server 9002"));
});
