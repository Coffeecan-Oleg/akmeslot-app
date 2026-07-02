const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
const initDataFile = (filename, defaultData) => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
  }
};

initDataFile('resources.json', { resources: [] });
initDataFile('bookings.json', { bookings: [] });
initDataFile('logs.json', { logs: [] });
initDataFile('config.json', {
  categories: [
    { id: 'workspace', name: 'Рабочее место', icon: '💼' },
    { id: 'meeting_room', name: 'Переговорная', icon: '🏢' },
    { id: 'office', name: 'Кабинет', icon: '🚪' },
    { id: 'car', name: 'Автомобиль', icon: '🚗' },
    { id: 'equipment', name: 'Оборудование', icon: '🔧' },
    { id: 'other', name: 'Другое', icon: '📦' }
  ],
  roles: {
    user: 'Пользователь',
    resource_admin: 'Администратор ресурса',
    system_admin: 'Системный администратор'
  }
});

// Helper functions
const readData = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
};

const writeData = (filename, data) => {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
};

const addLog = (action, userId, details) => {
  const logs = readData('logs.json');
  logs.logs.push({
    id: Date.now(),
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
  writeData('logs.json', logs);
};

// ===== RESOURCES API =====
app.get('/api/resources', (req, res) => {
  const data = readData('resources.json');
  res.json({ success: true, data: data.resources });
});

app.get('/api/resources/:id', (req, res) => {
  const data = readData('resources.json');
  const resource = data.resources.find(r => r.id === req.params.id);
  if (!resource) {
    return res.status(404).json({ success: false, error: 'Ресурс не найден' });
  }
  res.json({ success: true, data: resource });
});

app.post('/api/resources', (req, res) => {
  const data = readData('resources.json');
  const resource = {
    id: 'res_' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.resources.push(resource);
  writeData('resources.json', data);
  addLog('CREATE_RESOURCE', req.body.userId || 'system', { resourceId: resource.id, name: resource.name });
  res.status(201).json({ success: true, data: resource });
});

app.patch('/api/resources/:id', (req, res) => {
  const data = readData('resources.json');
  const index = data.resources.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Ресурс не найден' });
  }
  data.resources[index] = {
    ...data.resources[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  writeData('resources.json', data);
  addLog('UPDATE_RESOURCE', req.body.userId || 'system', { resourceId: req.params.id });
  res.json({ success: true, data: data.resources[index] });
});

app.delete('/api/resources/:id', (req, res) => {
  const data = readData('resources.json');
  const index = data.resources.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Ресурс не найден' });
  }
  const resource = data.resources[index];
  data.resources.splice(index, 1);
  writeData('resources.json', data);
  addLog('DELETE_RESOURCE', req.query.userId || 'system', { resourceId: req.params.id, name: resource.name });
  res.json({ success: true, message: 'Ресурс удалён' });
});

// ===== BOOKINGS API =====
app.get('/api/bookings', (req, res) => {
  const data = readData('bookings.json');
  let bookings = data.bookings;
  
  if (req.query.resourceId) {
    bookings = bookings.filter(b => b.resourceId === req.query.resourceId);
  }
  if (req.query.userId) {
    bookings = bookings.filter(b => b.userId === req.query.userId);
  }
  if (req.query.dateFrom && req.query.dateTo) {
    bookings = bookings.filter(b => {
      return b.dateFrom >= req.query.dateFrom && b.dateTo <= req.query.dateTo;
    });
  }
  if (req.query.status) {
    bookings = bookings.filter(b => b.status === req.query.status);
  }
  
  res.json({ success: true, data: bookings });
});

app.post('/api/bookings', (req, res) => {
  const { resourceId, userId, dateFrom, dateTo, title, description } = req.body;
  
  // Проверка конфликтов
  const data = readData('bookings.json');
  const conflicts = data.bookings.filter(b => {
    return b.resourceId === resourceId && 
           b.status !== 'cancelled' &&
           ((dateFrom >= b.dateFrom && dateFrom < b.dateTo) ||
            (dateTo > b.dateFrom && dateTo <= b.dateTo) ||
            (dateFrom <= b.dateFrom && dateTo >= b.dateTo));
  });
  
  if (conflicts.length > 0) {
    return res.status(409).json({ 
      success: false, 
      error: 'Конфликт бронирования',
      conflicts 
    });
  }
  
  const booking = {
    id: 'book_' + Date.now(),
    resourceId,
    userId,
    dateFrom,
    dateTo,
    title,
    description,
    status: 'active',
    calendarEventId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.bookings.push(booking);
  writeData('bookings.json', data);
  addLog('CREATE_BOOKING', userId, { bookingId: booking.id, resourceId, dateFrom, dateTo });
  
  res.status(201).json({ success: true, data: booking });
});

app.patch('/api/bookings/:id', (req, res) => {
  const data = readData('bookings.json');
  const index = data.bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
  }
  
  const booking = data.bookings[index];
  
  // Проверка конфликтов при изменении времени
  if (req.body.dateFrom || req.body.dateTo || req.body.resourceId) {
    const newDateFrom = req.body.dateFrom || booking.dateFrom;
    const newDateTo = req.body.dateTo || booking.dateTo;
    const newResourceId = req.body.resourceId || booking.resourceId;
    
    const conflicts = data.bookings.filter(b => {
      return b.id !== req.params.id &&
             b.resourceId === newResourceId && 
             b.status !== 'cancelled' &&
             ((newDateFrom >= b.dateFrom && newDateFrom < b.dateTo) ||
              (newDateTo > b.dateFrom && newDateTo <= b.dateTo) ||
              (newDateFrom <= b.dateFrom && newDateTo >= b.dateTo));
    });
    
    if (conflicts.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Конфликт бронирования',
        conflicts 
      });
    }
  }
  
  data.bookings[index] = {
    ...booking,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  writeData('bookings.json', data);
  addLog('UPDATE_BOOKING', req.body.userId || booking.userId, { bookingId: req.params.id });
  
  res.json({ success: true, data: data.bookings[index] });
});

app.delete('/api/bookings/:id', (req, res) => {
  const data = readData('bookings.json');
  const index = data.bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
  }
  
  data.bookings[index].status = 'cancelled';
  data.bookings[index].updatedAt = new Date().toISOString();
  writeData('bookings.json', data);
  
  addLog('CANCEL_BOOKING', req.query.userId || 'system', { bookingId: req.params.id });
  
  res.json({ success: true, message: 'Бронирование отменено' });
});

// ===== CONFIG API =====
app.get('/api/config/categories', (req, res) => {
  const config = readData('config.json');
  res.json({ success: true, data: config.categories });
});

app.get('/api/config/roles', (req, res) => {
  const config = readData('config.json');
  res.json({ success: true, data: config.roles });
});

// ===== LOGS API =====
app.get('/api/logs', (req, res) => {
  const logs = readData('logs.json');
  let filtered = logs.logs;
  
  if (req.query.userId) {
    filtered = filtered.filter(l => l.userId === req.query.userId);
  }
  if (req.query.action) {
    filtered = filtered.filter(l => l.action === req.query.action);
  }
  if (req.query.limit) {
    filtered = filtered.slice(-parseInt(req.query.limit));
  }
  
  res.json({ success: true, data: filtered });
});

// ===== CALENDAR API (Proxy to Bitrix24) =====
app.post('/api/calendar/events', async (req, res) => {
  try {
    const { name, from, to, description, location, attendees, sectionId } = req.body;
    const eventId = 'cal_' + Date.now();
    
    addLog('CREATE_CALENDAR_EVENT', req.body.userId, { eventId, name });
    
    res.status(201).json({ 
      success: true, 
      data: { id: eventId, name, from, to, description, location }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/calendar/events/:id', async (req, res) => {
  try {
    const { name, from, to, description, location } = req.body;
    addLog('UPDATE_CALENDAR_EVENT', req.body.userId, { eventId: req.params.id });
    
    res.json({ 
      success: true, 
      data: { id: req.params.id, name, from, to, description, location }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/calendar/events/:id', async (req, res) => {
  try {
    addLog('DELETE_CALENDAR_EVENT', req.query.userId, { eventId: req.params.id });
    res.json({ success: true, message: 'Событие удалено' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== NOTIFICATIONS API =====
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    addLog('SEND_NOTIFICATION', req.body.senderId || 'system', { 
      recipientId: userId, message, type 
    });
    res.json({ success: true, message: 'Уведомление отправлено' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BITRIX24 IFRAME HANDLER =====
// Битрикс24 открывает приложение через POST с AUTH_ID, DOMAIN, USER_ID
app.all('/', (req, res) => {
  const authId = req.body.AUTH_ID || req.query.AUTH_ID || '';
  const domain = req.body.DOMAIN || req.query.DOMAIN || '';
  const userId = req.body.USER_ID || req.query.USER_ID || '';
  const appSid = req.body.APP_SID || req.query.APP_SID || '';
  
  console.log('[Bitrix24] Auth params:', { domain, userId: userId ? 'present' : 'missing', authId: authId ? 'present' : 'missing' });
  
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>АкмеСлот — Бронирование ресурсов</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <div id="loading" style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif">
      <div style="text-align:center">
        <div style="font-size:48px;margin-bottom:20px">⏳</div>
        <p>Загрузка АкмеСлот...</p>
      </div>
    </div>
  </div>
  <script>
    window.BX24_PARAMS = ${JSON.stringify({ authId, domain, userId, appSid })};
    console.log('[AkmeSlot] BX24_PARAMS loaded:', window.BX24_PARAMS);
  </script>
  <script src="app.js"></script>
</body>
</html>`;
  
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`АкмеСлот сервер запущен на порту ${PORT}`);
});
