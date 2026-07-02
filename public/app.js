// AkmeSlot - Bitrix24 Embedded Booking System v5.0
class AkmeSlotApp {
  constructor() {
    this.app = document.getElementById("app");
    this.resources = [];
    this.bookings = [];
    this.filterType = null;
    this.user = null;
    this.currentView = 'resources';
    this.bxParams = window.BX24_PARAMS || {};
    this.apiBase = this.bxParams.domain ? `https://${this.bxParams.domain}/rest` : '';
    this.init();
  }

  async init() {
    console.log("[AkmeSlot] v5.0 Starting...");
    console.log("[AkmeSlot] Params:", this.bxParams);
    
    if (!this.bxParams.authId) {
      console.error("[AkmeSlot] No AUTH_ID");
      this.showError("Ошибка авторизации. Откройте приложение из меню Битрикс24.");
      return;
    }
    
    await this.loadUser();
    await this.loadResources();
    await this.loadBookings();
    this.render();
  }

  async loadUser() {
    const authId = this.bxParams.authId;
    const domain = this.bxParams.domain;
    
    if (authId && domain) {
      try {
        const appSid = this.bxParams.appSid;
        let url = `/api/me?auth=${authId}&domain=${domain}`;
        if (appSid) url += `&app_sid=${appSid}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.success && data.data) {
          this.user = { id: data.data.id, name: data.data.name, email: data.data.email || '' };
          return;
        }
      } catch (e) {
        console.log("[AkmeSlot] /api/me failed:", e.message);
      }
    }
    
    this.user = { id: 'unknown', name: 'Пользователь', email: '' };
  }

  async loadResources() {
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();
      if (data.success) this.resources = data.data;
    } catch (e) {
      console.error("[AkmeSlot] Error loading resources:", e);
    }
  }

  async loadBookings() {
    if (!this.user) return;
    try {
      const response = await fetch(`/api/bookings?userId=${this.user.id}`);
      const data = await response.json();
      if (data.success) this.bookings = data.data;
    } catch (e) {
      console.error("[AkmeSlot] Error loading bookings:", e);
    }
  }

  render() {
    if (this.currentView === 'resources') {
      this.renderResources();
    } else if (this.currentView === 'bookings') {
      this.renderBookings();
    }
  }

  renderResources() {
    const filtered = this.filterType 
      ? this.resources.filter(r => r.type === this.filterType)
      : this.resources;
    
    this.app.innerHTML = `
      <div style="display:flex;height:100vh;font-family:Arial,sans-serif">
        ${this.renderSidebar()}
        <main style="flex:1;padding:30px;overflow-y:auto;background:#f8fafc">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px">
            <h2 style="margin:0;color:#1e293b;font-size:24px">${this.getCategoryName(this.filterType)}</h2>
            <div style="color:#64748b;font-size:14px">${filtered.length} ресурсов</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
            ${filtered.map(res => this.renderResourceCard(res)).join('')}
          </div>
        </main>
      </div>
      ${this.renderBookingModal()}
    `;
    
    this.attachModalListeners();
  }

  renderBookings() {
    const activeBookings = this.bookings.filter(b => b.status === 'active');
    
    this.app.innerHTML = `
      <div style="display:flex;height:100vh;font-family:Arial,sans-serif">
        ${this.renderSidebar()}
        <main style="flex:1;padding:30px;overflow-y:auto;background:#f8fafc">
          <h2 style="margin:0 0 25px 0;color:#1e293b;font-size:24px">Мои бронирования</h2>
          ${activeBookings.length === 0 
            ? '<div style="text-align:center;padding:60px;color:#64748b"><div style="font-size:48px;margin-bottom:20px">📅</div><p>У вас пока нет бронирований</p></div>'
            : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px">${activeBookings.map(b => this.renderBookingCard(b)).join('')}</div>`
          }
        </main>
      </div>
    `;
  }

  renderSidebar() {
    const userName = this.user ? this.user.name : 'Пользователь';
    return `
      <aside style="width:260px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column">
        <div style="padding:20px;border-bottom:1px solid #e2e8f0">
          <h1 style="color:#4f46e5;font-size:22px;font-weight:bold;margin:0">🏢 АКМЕСЛОТ</h1>
          <p style="color:#64748b;font-size:12px;margin:5px 0 0 0">Бронирование ресурсов</p>
        </div>
        <nav style="flex:1;overflow-y:auto">
          <a href="#" onclick="app.setView('resources'); return false;" 
            style="display:block;padding:14px 20px;text-decoration:none;font-size:14px;border-bottom:1px solid #f1f5f9;${this.currentView === 'resources' ? 'background:#eef2ff;color:#4f46e5;border-right:3px solid #4f46e5' : 'color:#334155'}">
            📋 Ресурсы
          </a>
          <a href="#" onclick="app.setView('bookings'); return false;" 
            style="display:block;padding:14px 20px;text-decoration:none;font-size:14px;border-bottom:1px solid #f1f5f9;${this.currentView === 'bookings' ? 'background:#eef2ff;color:#4f46e5;border-right:3px solid #4f46e5' : 'color:#334155'}">
            📅 Мои бронирования ${this.bookings.filter(b => b.status === 'active').length > 0 ? `<span style="background:#4f46e5;color:#fff;border-radius:10px;padding:2px 8px;font-size:12px;margin-left:8px">${this.bookings.filter(b => b.status === 'active').length}</span>` : ''}
          </a>
          <div style="padding:10px 20px;font-size:12px;color:#64748b;margin-top:10px">КАТЕГОРИИ</div>
          ${[
            { id: null, label: '📋 Все' },
            { id: 'meeting_room', label: '🏢 Переговорные' },
            { id: 'workplace', label: '💼 Рабочие места' },
            { id: 'car', label: '🚗 Автомобили' },
            { id: 'equipment', label: '🔧 Оборудование' }
          ].map(item => {
            const isActive = this.filterType === item.id && this.currentView === 'resources';
            return `<a href="#" onclick="app.setFilter('${item.id || ''}'); return false;" 
              style="display:block;padding:10px 20px;text-decoration:none;font-size:13px;border-bottom:1px solid #f1f5f9;${isActive ? 'background:#eef2ff;color:#4f46e5' : 'color:#334155'}">
              ${item.label}
            </a>`;
          }).join('')}
        </nav>
        <div style="padding:15px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155">
          <div style="font-weight:bold;margin-bottom:5px">👤 ${userName}</div>
          <div style="font-size:11px;color:#64748b">${this.user.email}</div>
        </div>
      </aside>
    `;
  }

  renderResourceCard(res) {
    const icons = { meeting_room: '🏢', workplace: '💼', car: '🚗', equipment: '🔧', office: '🚪', other: '📦' };
    const icon = icons[res.type] || '📦';
    const isBooked = this.isResourceBooked(res.id);
    
    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;margin-bottom:12px">
          <div style="font-size:32px;margin-right:12px">${icon}</div>
          <div style="flex:1">
            <h4 style="margin:0;color:#1e293b;font-size:16px;font-weight:600">${res.name}</h4>
            <div style="font-size:12px;color:#64748b;margin-top:4px">${res.location}</div>
          </div>
        </div>
        <p style="margin:0 0 12px 0;font-size:13px;color:#64748b;line-height:1.5">${res.description}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
          ${(res.amenities || []).map(a => `<span style="background:#f1f5f9;color:#475569;padding:4px 10px;border-radius:6px;font-size:12px">${a}</span>`).join('')}
        </div>
        <button onclick="app.openBookingModal('${res.id}')" 
          style="width:100%;padding:10px;background:${isBooked ? '#ef4444' : '#4f46e5'};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500"
          ${isBooked ? 'disabled' : ''}>
          ${isBooked ? '🔒 Занят' : '📅 Забронировать'}
        </button>
      </div>
    `;
  }

  renderBookingCard(booking) {
    const resource = this.resources.find(r => r.id === booking.resourceId);
    const icons = { meeting_room: '🏢', workplace: '💼', car: '🚗', equipment: '🔧' };
    const icon = resource ? icons[resource.type] || '📦' : '📦';
    
    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="display:flex;align-items:center;margin-bottom:12px">
          <div style="font-size:32px;margin-right:12px">${icon}</div>
          <div>
            <h4 style="margin:0;color:#1e293b;font-size:16px;font-weight:600">${resource ? resource.name : 'Неизвестный ресурс'}</h4>
            <div style="font-size:12px;color:#64748b;margin-top:4px">${booking.title}</div>
          </div>
        </div>
        <div style="background:#f8fafc;padding:12px;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;color:#334155"><strong>📅 Дата:</strong> ${new Date(booking.dateFrom).toLocaleDateString('ru-RU')}</div>
          <div style="font-size:13px;color:#334155;margin-top:4px"><strong>🕐 Время:</strong> ${new Date(booking.dateFrom).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - ${new Date(booking.dateTo).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div>
        </div>
        <button onclick="app.cancelBooking('${booking.id}')" 
          style="width:100%;padding:10px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px">
          ❌ Отменить бронирование
        </button>
      </div>
    `;
  }

  renderBookingModal() {
    return `
      <div id="booking-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:16px;padding:32px;width:90%;max-width:500px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
            <h3 style="margin:0;color:#1e293b;font-size:20px">📅 Бронирование</h3>
            <button onclick="app.closeBookingModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#64748b">&times;</button>
          </div>
          <form id="booking-form">
            <input type="hidden" id="booking-resource-id">
            <div style="margin-bottom:16px">
              <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">Ресурс</label>
              <input type="text" id="booking-resource-name" readonly style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;font-size:14px">
            </div>
            <div style="margin-bottom:16px">
              <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">📅 Дата</label>
              <input type="date" id="booking-date" required style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
              <div>
                <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">🕐 Начало</label>
                <select id="booking-time-from" required style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px">
                  ${Array.from({length: 24}, (_, i) => `<option value="${String(i).padStart(2, '0')}:00">${String(i).padStart(2, '0')}:00</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">⏱️ Длительность</label>
                <select id="booking-duration" required style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px">
                  <option value="30">30 минут</option>
                  <option value="60" selected>1 час</option>
                  <option value="90">1.5 часа</option>
                  <option value="120">2 часа</option>
                  <option value="180">3 часа</option>
                  <option value="240">4 часа</option>
                  <option value="480">8 часов</option>
                </select>
              </div>
            </div>
            <div style="margin-bottom:16px">
              <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">📝 Название встречи</label>
              <input type="text" id="booking-title" required placeholder="Например: Совещание с клиентом" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px">
            </div>
            <div style="margin-bottom:24px">
              <label style="display:block;font-size:14px;color:#334155;margin-bottom:6px;font-weight:500">📝 Описание (необязательно)</label>
              <textarea id="booking-description" rows="3" placeholder="Дополнительная информация..." style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;resize:vertical"></textarea>
            </div>
            <button type="submit" style="width:100%;padding:12px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:500">
              ✅ Подтвердить бронирование
            </button>
          </form>
        </div>
      </div>
    `;
  }

  attachModalListeners() {
    const form = document.getElementById('booking-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createBooking();
      });
    }
  }

  openBookingModal(resourceId) {
    const resource = this.resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    document.getElementById('booking-resource-id').value = resourceId;
    document.getElementById('booking-resource-name').value = resource.name;
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').value = today;
    
    // Set default time to next hour
    const now = new Date();
    const nextHour = String(now.getHours() + 1).padStart(2, '0') + ':00';
    document.getElementById('booking-time-from').value = nextHour;
    
    const modal = document.getElementById('booking-modal');
    modal.style.display = 'flex';
  }

  closeBookingModal() {
    const modal = document.getElementById('booking-modal');
    modal.style.display = 'none';
  }

  async createBooking() {
    const resourceId = document.getElementById('booking-resource-id').value;
    const date = document.getElementById('booking-date').value;
    const timeFrom = document.getElementById('booking-time-from').value;
    const duration = parseInt(document.getElementById('booking-duration').value);
    const title = document.getElementById('booking-title').value;
    const description = document.getElementById('booking-description').value;
    
    const dateFrom = new Date(`${date}T${timeFrom}:00`);
    const dateTo = new Date(dateFrom.getTime() + duration * 60000);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          userId: this.user.id,
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
          title,
          description
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Бронирование создано!');
        this.closeBookingModal();
        await this.loadBookings();
        this.render();
      } else {
        alert('❌ Ошибка: ' + (data.error || 'Не удалось создать бронирование'));
      }
    } catch (e) {
      alert('❌ Ошибка сети: ' + e.message);
    }
  }

  async cancelBooking(bookingId) {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}?userId=${this.user.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Бронирование отменено');
        await this.loadBookings();
        this.render();
      } else {
        alert('❌ Ошибка: ' + (data.error || 'Не удалось отменить'));
      }
    } catch (e) {
      alert('❌ Ошибка сети: ' + e.message);
    }
  }

  isResourceBooked(resourceId) {
    const now = new Date().toISOString();
    return this.bookings.some(b => 
      b.resourceId === resourceId && 
      b.status === 'active' &&
      b.dateTo > now
    );
  }

  setView(view) {
    this.currentView = view;
    this.render();
  }

  setFilter(type) {
    this.filterType = type || null;
    this.currentView = 'resources';
    this.render();
  }

  getCategoryName(type) {
    const names = {
      meeting_room: '🏢 Переговорные',
      workplace: '💼 Рабочие места',
      car: '🚗 Автомобили',
      equipment: '🔧 Оборудование'
    };
    return names[type] || '📋 Все ресурсы';
  }

  showError(message) {
    this.app.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#fef2f2;font-family:Arial,sans-serif">
        <div style="text-align:center;padding:40px;max-width:400px">
          <div style="font-size:60px;margin-bottom:20px">⚠️</div>
          <h2 style="color:#dc2626;margin:0 0 10px 0;font-size:20px">Ошибка</h2>
          <p style="color:#991b1b;margin:0;line-height:1.5">${message}</p>
          <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px">
            🔄 Перезагрузить
          </button>
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AkmeSlotApp();
});
