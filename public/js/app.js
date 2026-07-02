let currentUser = { id: '3318', name: 'Олег Кромин', role: 'system_admin' };
let resources = [];
let bookings = [];
let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Init
  document.getElementById('date-filter').valueAsDate = new Date();
  
  await loadData();
  setupEventListeners();
  render();
});

async function loadData() {
  const [resCats, resList, resBook] = await Promise.all([
    api.get('/config/categories'),
    api.get('/resources'),
    api.get(`/bookings?userId=${currentUser.id}`)
  ]);
  
  if (resCats.success) categories = resCats.data;
  if (resList.success) resources = resList.data;
  if (resBook.success) bookings = resBook.data;
  
  populateCategoryFilter();
}

function populateCategoryFilter() {
  const select = document.getElementById('category-filter');
  select.innerHTML = '<option value="">Все категории</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icon} ${cat.name}`;
    select.appendChild(opt);
  });
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`${btn.dataset.view}-view`).classList.add('active');
    });
  });

  // Filters
  document.getElementById('category-filter').addEventListener('change', render);
  document.getElementById('date-filter').addEventListener('change', render);

  // Modal Close
  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('booking-modal').classList.remove('active');
  });

  // Booking Form
  document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const resourceId = document.getElementById('booking-resource-id').value;
  const date = document.getElementById('booking-date').value;
  const timeFrom = document.getElementById('booking-time-from').value;
  const duration = parseInt(document.getElementById('booking-duration').value);
  
  const dateFrom = new Date(`${date}T${timeFrom}:00`);
  const dateTo = new Date(dateFrom.getTime() + duration * 60000);
  
  const payload = {
    resourceId,
    userId: currentUser.id,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    title: document.getElementById('booking-title').value,
    description: document.getElementById('booking-description').value
  };

  const res = await api.post('/bookings', payload);
  if (res.success) {
    alert('Успешно забронировано!');
    document.getElementById('booking-modal').classList.remove('active');
    await loadData();
    render();
  } else {
    alert('Ошибка: ' + res.error);
  }
}

function render() {
  renderResources();
  renderBookings();
}

function renderResources() {
  const list = document.getElementById('resources-list');
  const catFilter = document.getElementById('category-filter').value;
  const dateFilter = document.getElementById('date-filter').value;

  const filtered = resources.filter(r => !catFilter || r.categoryId === catFilter);
  
  list.innerHTML = filtered.map(r => {
    const status = getStatus(r.id, dateFilter);
    const cat = categories.find(c => c.id === r.categoryId);
    return `
      <div class="resource-card">
        <span class="category">${cat?.icon || ''} ${cat?.name || ''}</span>
        <h3>${r.name}</h3>
        <p>${r.description || ''}</p>
        <div class="status ${status.class}">${status.text}</div>
        <button class="btn btn-primary" onclick="openBooking('${r.id}', '${r.name}')">Забронировать</button>
      </div>
    `;
  }).join('');
}

function getStatus(resId, date) {
  const resBookings = bookings.filter(b => 
    b.resourceId === resId && 
    b.status === 'active' &&
    b.dateFrom.startsWith(date)
  );
  
  if (resBookings.length === 0) return { class: 'free', text: 'Свободно' };
  if (resBookings.some(b => b.userId === currentUser.id)) return { class: 'my-booking', text: 'Моя бронь' };
  return { class: 'busy', text: 'Занято' };
}

function renderBookings() {
  const list = document.getElementById('bookings-list');
  if (bookings.length === 0) {
    list.innerHTML = '<p>У вас пока нет бронирований.</p>';
    return;
  }
  list.innerHTML = bookings.map(b => {
    const res = resources.find(r => r.id === b.resourceId);
    return `
      <div class="booking-item">
        <div>
          <strong>${b.title || 'Без названия'}</strong><br>
          <small>${res ? res.name : 'Ресурс'} | ${new Date(b.dateFrom).toLocaleString()}</small>
        </div>
        <button class="btn btn-danger" onclick="cancelBooking('${b.id}')">Отменить</button>
      </div>
    `;
  }).join('');
}

window.openBooking = (id, name) => {
  document.getElementById('booking-resource-id').value = id;
  document.getElementById('booking-resource-name').value = name;
  document.getElementById('booking-modal').classList.add('active');
  
  const select = document.getElementById('booking-time-from');
  select.innerHTML = '';
  for (let h = 8; h < 20; h++) {
    for (let m of ['00', '30']) {
      const time = `${h.toString().padStart(2, '0')}:${m}`;
      const opt = document.createElement('option');
      opt.value = time; opt.textContent = time;
      select.appendChild(opt);
    }
  }
};

window.cancelBooking = async (id) => {
  if (!confirm('Отменить бронирование?')) return;
  const res = await api.delete(`/bookings/${id}?userId=${currentUser.id}`);
  if (res.success) {
    await loadData();
    render();
  } else {
    alert(res.error);
  }
};
