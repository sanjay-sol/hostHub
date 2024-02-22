const express = require("express");
const app = express();
const Redis = require("ioredis");
const { Server } = require("socket.io");

const subscriber = new Redis(
  "rediss://default:AVNS_uwUrvXtzocWMFdio5Zi@redis-6f2c738-sanjaysirangi-1cca.a.aivencloud.com:17389"
);
const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9002, () => console.log("Socket Server 9002"));


app.use(express.json());

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

