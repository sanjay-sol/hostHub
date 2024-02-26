const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const PORT = 8000;

const BASE_PATH = "https://hosthub-bucket.s3.ap-south-1.amazonaws.com/__output";

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  const hostname = req.hostname;

  console.log(hostname, "hostname")
  const subdomain = hostname.split(".")[0];
  console.log(subdomain, "subdomain")

  const resolvesTo = `${BASE_PATH}/${subdomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));
