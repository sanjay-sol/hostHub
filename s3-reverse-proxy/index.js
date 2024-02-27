const express = require("express");
const httpProxy = require("http-proxy");
const cors = require("cors");
const app = express();
app.use(cors({ origin: "*" }));
const PORT = 8000;

const BASE_PATH = "https://hosthub-bucket.s3.ap-south-1.amazonaws.com/__output";

const proxy = httpProxy.createProxy();

app.get("/*", (req, res) => {
  const hostname = req.hostname;
  console.log("Hostname", hostname);

  const subdomain = hostname.split(".")[0];
  console.log("Subdomain", subdomain);

  const resolvesTo = `${BASE_PATH}/${subdomain}`;
  console.log("Resolves To", resolvesTo);

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// Adjust the import path based on your file structure
// const express = require("express");
// const { downloadS3Folder } = require("./utils");
// const path = require("path");
// const app = express();
// const PORT = 8000;

// // Serve static files from the "output/test" directory
// app.use("/test", express.static(path.join(__dirname, "output", "test")));

// // Define a route to fetch and stream files from S3
// app.get("*", async (req, res) => {
//   const { pathname } = new URL(req.url, `http://${req.headers.host}`);
//   const s3FolderPrefix = `__output${pathname}`;
//   console.log("S3 Folder Prefix:", s3FolderPrefix);

//   try {
//     // Fetch and stream files from S3
//     await downloadS3Folder(s3FolderPrefix);

//     // Send success response
//     res.status(200).send("Files streamed from S3 successfully");
//   } catch (error) {
//     console.error("Error streaming files from S3:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // Start the Express server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// const express = require("express");
// const { S3 } = require("aws-sdk");
// const path = require("path");
// const fs = require("fs").promises;
// const app = express();
// const PORT = 8000;

// // Initialize the S3 client
// const s3 = new S3({
//   region: "ap-south-1",
//   credentials: {
//     accessKeyId: "AKIA4OQ3QXUXQCTZ3BF3",
//     secretAccessKey: "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",
//   },
// });

// // Define a route to fetch and serve files from S3
// app.get("*", async (req, res) => {
//   try {
//     // Construct the S3 key from the request path
//     const s3Key = `__output${req.path}`;
//     console.log("S3 Key:", s3Key);

//     // Retrieve the file content from S3
//     const data = await s3
//       .getObject({ Bucket: "hosthub-bucket", Key: s3Key })
//       .promise();

//     // Set the appropriate content type based on the file extension
//     const contentType = getContentType(req.path);
//     res.set("Content-Type", contentType);

//     // Send the file content as the response
//     res.status(200).send(data.Body);
//   } catch (error) {
//     console.error("Error serving file from S3:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // Helper function to determine the content type based on the file extension
// function getContentType(filePath) {
//   const ext = path.extname(filePath).toLowerCase();
//   switch (ext) {
//     case ".html":
//       return "text/html";
//     case ".css":
//       return "text/css";
//     case ".js":
//       return "application/javascript";
//     default:
//       return "application/octet-stream";
//   }
// }

// // Start the Express server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
