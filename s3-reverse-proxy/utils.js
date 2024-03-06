const { S3 } = require("aws-sdk");
const fs = require("fs");

const path = require("path");

const s3 = new S3({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESSKEY_ID,
    secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function downloadS3Folder(prefix) {
  const allFiles = await s3
    .listObjectsV2({ Bucket: "hosthub-bucket", Prefix: prefix })
    .promise();

  const allPromises =
    allFiles.Contents?.map(async ({ Key }) => {
      return new Promise(async (resolve, reject) => {
        try {
          if (!Key) {
            resolve("");
            return;
          }
          const finalOutputPath = path.join(__dirname, Key);
          const dirName = path.dirname(finalOutputPath);
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
          }
          const data = await s3
            .getObject({ Bucket: "hosthub-bucket", Key })
            .promise();
          fs.writeFileSync(finalOutputPath, data.Body);
          resolve("");
        } catch (error) {
          reject(error);
        }
      });
    }) || [];

  console.log("awaiting");
  await Promise.all(allPromises);
}

 function copyFinalDist(id) {
  const folderPath = path.join(__dirname, `output/${id}/dist`);
//   const allFiles = getAllFiles(folderPath);
//   allFiles.forEach((file) => {
//     uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
//   });
}

const getAllFiles = (folderPath) => {
  let response = [];

  const allFilesAndFolders = fs.readdirSync(folderPath);
  allFilesAndFolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  });
  return response;
};

const uploadFile = async (fileName, localFilePath) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "vercel",
      Key: fileName,
    })
    .promise();
  console.log(response);
};


module.exports = { downloadS3Folder, copyFinalDist };