const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
const app = express();
const PORT = 9000;

const ecsClient = new ECSClient({
    region: "ap-south-1",
  credentials: {
  
  },
});

const config = {
  CLUSTER: "arn:aws:ecs:ap-south-1:855829953839:cluster/builder-cluster-1",
  TASK: "arn:aws:ecs:ap-south-1:855829953839:task-definition/builder-task:1",
};

app.use(express.json());

app.use("/project",async (req, res) => {
  const { gitURL } = req.body;
  const projectSlug = generateSlug();

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
    return res.json({ status : "queued" , data : { projectSlug , url : `http://${projectSlug}:8000` } });
});

app.listen(PORT, () => console.log(`Api Server Running..${PORT}`));
