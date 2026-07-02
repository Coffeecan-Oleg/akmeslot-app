// AkmeSlot - Bitrix24 Embedded Booking System v4 (No BX24 SDK)
class AkmeSlotApp {
  constructor() {
    this.app = document.getElementById("app");
    this.resources = [];
    this.bookings = [];
    this.filterType = null;
    this.user = null;
    this.bxParams = window.BX24_PARAMS || {};
    this.apiBase = this.bxParams.domain ? `https://${this.bxParams.domain}/rest` : '';
    this.init();
  }

  async init() {
    console.log("[AkmeSlot] v4 Starting...");
    console.log("[AkmeSlot] Params:", this.bxParams);
    
    if (!this.bxParams.authId) {
      console.error("[AkmeSlot] No AUTH_ID");
      this.showError("Ошибка авторизации. Откройте приложение из меню Битрикс24.");
      return;
    }
    
    await this.loadUser();
    await this.loadResources();
    this.render();
  }

  async loadUser() {
    try {
      const data = await this.callBitrix24('user.current');
      console.log("[AkmeSlot] User:", data);
      this.user = {
        id: data.ID,
        name: (data.NAME || '') + ' ' + (data.LAST_NAME || ''),
        email: data.EMAIL || '',
        avatar: data.PERSONAL_PHOTO || ''
      };
    } catch (e) {
      console.error("[AkmeSlot] Error loading user:", e);
      this.user = { id: this.bxParams.userId || 'unknown', name: 'Пользователь', email: '' };
    }
  }

  async callBitrix24(method, params = {}) {
    const url = new URL(`${this.apiBase}/${method}`);
    url.searchParams.append('auth', this.bxParams.authId);
    
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
    
    return data.result;
  }

  async loadResources() {
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();
      if (data.success) {
        this.resources = data.data;
      }
    } catch (e) {
      console.error("[AkmeSlot] Error loading resources:", e);
      this.resources = [];
    }
  }

  async loadBookings() {
    try {
      const response = await fetch(`/api/bookings?userId=${this.user.id}`);
      const data = await response.json();
      if (data.success) {
        this.bookings = data.data;
      }
    } catch (e) {
      console.error("[AkmeSlot] Error loading bookings:", e);
      this.bookings = [];
    }
  }

  render() {
    const userName = this.user ? this.user.name : 'Пользователь';
    
    this.app.innerHTML = `
      <div style="display:flex;height:100vh;font-family:Arial,sans-serif">
        <aside style="width:260px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column">
          <div style="padding:20px;border-bottom:1px solid #e2e8f0">
            <h1 style="color:#4f46e5;font-size:22px;font-weight:bold;margin:0">🏢 АКМЕСЛОТ</h1>
            <p style="color:#64748b;font-size:12px;margin:5px 0 0 0">Бронирование ресурсов</p>
          </div>
          <nav style="flex:1;overflow-y:auto">
            ${this.renderNav()}
          </nav>
          <div style="padding:15px;border-top:1px solid #e2e8f0;font-size:13px;color:#334155">
            <div style="font-weight:bold;margin-bottom:5px">👤 ${userName}</div>
            <div style="font-size:11px;color:#64748b">${this.user.email}</div>
          </div>
        </aside>
        <main style="flex:1;padding:30px;overflow-y:auto;background:#f8fafc">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px">
            <h2 style="margin:0;color:#1e293b;font-size:24px">${this.getCategoryName(this.filterType)}</h2>
            <div style="color:#64748b;font-size:14px">${this.resources.length} ресурсов</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px">
            ${this.resources.map(res => this.renderCard(res)).join('')}
          </div>
        </main>
      </div>
    `;
  }

  renderNav() {
    const items = [
      { id: null, label: '📋 Все ресурсы' },
      { id: 'meeting_room', label: '🏢 Переговорные' },
      { id: 'workplace', label: '💼 Рабочие места' },
      { id: 'car', label: '🚗 Автомобили' },
      { id: 'equipment', label: '🔧 Оборудование' }
    ];
    
    return items.map(item => {
      const isActive = this.filterType === item.id;
      const style = isActive 
        ? 'background:#eef2ff;color:#4f46e5;border-right:3px solid #4f46e5' 
        : 'color:#334155';
      return `<a href="#" onclick="app.setFilter('${item.id || ''}'); return false;" 
        style="display:block;padding:14px 20px;text-decoration:none;font-size:14px;border-bottom:1px solid #f1f5f9;${style}">
        ${item.label}
      </a>`;
    }).join('');
  }

  renderCard(res) {
    const icons = {
      meeting_room: '🏢',
      workplace: '💼',
      car: '🚗',
      equipment: '🔧',
      office: '🚪',
      other: '📦'
    };
    const icon = icons[res.type] || '📦';
    const statusColor = res.status === 'available' ? '#10b981' : '#ef4444';
    const statusText = res.status === 'available' ? 'Свободен' : 'Занят';
    
    return `
      <div onclick="app.selectResource('${res.id}')" 
        style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;cursor:pointer;
               box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:all 0.2s"
        onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" 
        onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'">
        <div style="display:flex;align-items:center;margin-bottom:12px">
          <div style="font-size:32px;margin-right:12px">${icon}</div>
          <div>
            <h4 style="margin:0;color:#1e293b;font-size:16px;font-weight:600">${res.name}</h4>
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;margin-top:4px">${res.type}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:${statusColor}"></div>
          <span style="font-size:13px;color:${statusColor};font-weight:500">${statusText}</span>
        </div>
        ${res.description ? `<p style="margin:12px 0 0 0;font-size:13px;color:#64748b;line-height:1.5">${res.description}</p>` : ''}
      </div>
    `;
  }

  setFilter(type) {
    this.filterType = type || null;
    this.render();
  }

  selectResource(id) {
    this.selectedResource = this.resources.find(r => r.id === id);
    if (this.selectedResource) {
      alert('Выбран: ' + this.selectedResource.name);
    }
  }

  getCategoryName(type) {
    const names = {
      meeting_room: 'Переговорные',
      workplace: 'Рабочие места',
      car: 'Автомобили',
      equipment: 'Оборудование',
      office: 'Кабинеты',
      other: 'Другое'
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AkmeSlotApp();
});
