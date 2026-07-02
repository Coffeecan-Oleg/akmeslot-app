const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Parse POST body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files
app.use("/app.js", express.static(path.join(__dirname, "public", "app.js")));

// Handle root - both GET and POST
app.all("/", (req, res) => {
  const authId = req.body.AUTH_ID || req.query.AUTH_ID || "";
  const domain = req.body.DOMAIN || req.query.DOMAIN || "";
  const userId = req.body.USER_ID || req.query.USER_ID || "";
  const appSid = req.body.APP_SID || req.query.APP_SID || "";
  
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AkmeSlot</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
  </style>
</head>
<body class="bg-slate-50">
  <div id="root">
    <div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-slate-500">Loading...</p>
      </div>
    </div>
  </div>
  <script>
    window.BX24_PARAMS = {
      AUTH_ID: "${authId}",
      DOMAIN: "${domain}",
      USER_ID: "${userId}",
      APP_SID: "${appSid}"
    };
  </script>
  <script src="app.js"></script>
</body>
</html>`;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log("AkmeSlot server running on port " + PORT);
});