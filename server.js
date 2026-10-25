// 备用本地服务器（没有 Python 时使用）：node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = __dirname;
const BASE_PORT = Number(process.env.PORT || 8901);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function createServer(port) {
  const server = http.createServer((req, res) => {
    let requestPath;
    try {
      requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end("Bad Request");
      return;
    }

    if (requestPath === "/") requestPath = "/index.html";
    const file = path.resolve(ROOT, `.${requestPath}`);
    if (file !== ROOT && !file.startsWith(`${ROOT}${path.sep}`)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(err.code === "ENOENT" ? 404 : 500).end(err.code === "ENOENT" ? "Not Found" : "Server Error");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    });
  });

  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && port < BASE_PORT + 20) {
      createServer(port + 1);
      return;
    }
    console.error(`本地服务启动失败：${err.message}`);
    process.exitCode = 1;
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}/`;
    console.log(`游戏已启动：${url}`);
    console.log("保持此窗口开启；关闭窗口即可停止服务。");
    const command = process.platform === "win32" ? `start "" "${url}"` : `open "${url}"`;
    exec(command, () => {});
  });
}

createServer(BASE_PORT);
