const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mimeType = require("mime-types");

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
 
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Starting server...");

  const outDirPath = path.join(__dirname, "output");
   
  const p = exec(`cd ${outDirPath} && npm install && npm run build`);
  p.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  console.log("1----")

  p.stdout.on("error", function (data) {
    console.error("Error", data.toString());
  });
  console.log("2----");

  p.on("close", async function () {
    console.log(`Build completed.`);
    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });
  console.log("3----");
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
  console.log("4----");

      if (fs.lstatSync(filePath).isDirectory()) continue;
      console.log("Uploading", filePath);
      const command = new PutObjectCommand({
        Bucket: "hosthub-bucket",
        Key: `__output/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mimeType.lookup(filePath),
      });
  console.log("5----");

      await s3Client.send(command);
      console.log("uploaded", filePath);
    }
    console.log(" Done.");
  });
}

init();