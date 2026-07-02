exports.handler = async (event, context) => {
  // Parse POST body from Bitrix24
  const params = new URLSearchParams(event.body || '');
  const authId = params.get('AUTH_ID') || '';
  const domain = params.get('DOMAIN') || '';
  const userId = params.get('USER_ID') || '';
  const appSid = params.get('APP_SID') || '';
  
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
      AUTH_ID: '${authId}',
      DOMAIN: '${domain}',
      USER_ID: '${userId}',
      APP_SID: '${appSid}'
    };
  </script>
  <script src="app.js"></script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    },
    body: html
  };
};
