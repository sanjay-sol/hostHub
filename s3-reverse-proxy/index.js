const express = require("express");
const httpProxy = require("http-proxy");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: "*" }));

const BASE_PATH = process.env.BASE_PATH;

//* Create HTTP proxy
const proxy = httpProxy.createProxy();

app.get("/*", (req, res, next) => {

  //! Extract hostname from request
  const hostname = req.hostname;

  //! Extract subdomain from hostname
  const subdomain = hostname.split(".")[0];

  //! Construct URL to proxy to based on subdomain
  const resolvesTo = `${BASE_PATH}/${subdomain}`;

  //! Proxy the request to the resolved URL
  proxy.web(req, res, { target: resolvesTo, changeOrigin: true }, (err) => {
    next(err);
  });
});


proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  res.status(500).send("Internal Server Error");
});

app.listen(PORT, () => console.log(`Reverse Proxy Running..${PORT}`));
