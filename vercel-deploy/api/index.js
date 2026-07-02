module.exports = (req, res) => {
  // Handle both GET and POST requests
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AkmeSlot</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://api.bitrix24.com/api/v1/"></script>
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
  <script src="app.js?v=5"></script>
</body>
</html>`);
};
