const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
require("dotenv").config();
const app = express();
const PORT = 9000;
const Redis = require("ioredis");
const { Server } = require("socket.io");

const subscriber = new Redis(
  process.env.REDIS_URL
);

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9002, () => console.log("Socket Server 9002"));

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: process.env.AWS_CLUSTER,
  TASK: process.env.AWS_TASK,
};

app.use(express.json());

app.use("/project", async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  //! Spin the container by api call
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [
          "subnet-0603067e151c25464",
          "subnet-012b6d8474b814aaa",
          "subnet-0a8c7166955ff0521",
        ],
        securityGroups: ["sg-0d9dc983fa2acffbd"],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-image",
          environment: [
            {
              name: "GIT_URL",
              value: gitURL,
            },
            {
              name: "PROJECT_ID",
              value: projectSlug,
            },
          ],
        },
      ],
    },
  });
  await ecsClient.send(command);
  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}:8000` },
  });
});
async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

app.listen(PORT, () => console.log(`Api Server Running..${PORT}`));
