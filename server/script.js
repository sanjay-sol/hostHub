const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mimeType = require("mime-types");
const Redis = require("ioredis");


const Publisher = new Redis(
  "rediss://default:AVNS_uwUrvXtzocWMFdio5Zi@redis-6f2c738-sanjaysirangi-1cca.a.aivencloud.com:17389"
);


const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA4OQ3QXUXQCTZ3BF3",
    secretAccessKey: "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",
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

function publishLogs(logs) {
  Publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify(logs));
}

async function init() {
  console.log("Starting server...");
  publishLogs('Build started...');
  const outDirPath = path.join(__dirname, "output");
   
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);
  p.stdout.on("data", function (data) {
    console.log(data.toString());
  publishLogs(data.toString());

  });

  p.stdout.on("error", function (data) {
    console.error("Error", data.toString());
    publishLogs(`error : ${data.toString()}`);
  });
  console.log("2----");

  p.on("close", async function () {
    console.log(`Build completed.`);
    publishLogs('Build completed...');
    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });
    publishLogs('Uploading files...');
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);

      if (fs.lstatSync(filePath).isDirectory()) continue;
      console.log("Uploading", filePath);
      publishLogs(`Uploading ${file}`);
      const command = new PutObjectCommand({
        Bucket: "hosthub-bucket",
        Key: `__output/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mimeType.lookup(filePath),
      });

      await s3Client.send(command);
      publishLogs(`Uploaded ${file}`);
      console.log("uploaded", filePath);
    }
    publishLogs('Upload completed...');
    console.log(" Done.");
    process.exit(0);
  });
}

init();