const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 9000;

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: process.env.AWS_CLUSTER,
  TASK: process.env.AWS_TASK,
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/deploy", async (req, res) => {
  try {
    const data = await prisma.project.findMany();
    return res.json(data);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/project", async (req, res) => {
  try {
    const { gitURL, slug } = req.body;
    const projectSlug = slug || generateSlug();

    const command = new RunTaskCommand({
      cluster: config.CLUSTER,
      taskDefinition: config.TASK,
      launchType: "FARGATE",
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            process.env.AWS_SUBNET1,
            process.env.AWS_SUBNET2,
            process.env.AWS_SUBNET3,
          ],
          securityGroups: [`sg-${process.env.AWS_SECURITY_GROUP}`],
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: process.env.AWS_IMAGE_NAME,
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
      data: { projectSlug, url: `http://${projectSlug}.localhost:8000` },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => console.log(`Api Server Running..${PORT}`));
