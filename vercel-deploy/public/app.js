// AkmeSlot - Bitrix24 Embedded Booking System v4
class AkmeSlotApp {
  constructor() {
    this.root = document.getElementById("root");
    this.resources = [];
    this.bookings = [];
    this.filterType = null;
    this.user = null;
    this.init();
  }

  async init() {
    console.log("[AkmeSlot] v4 Starting...");
    console.log("[AkmeSlot] URL:", window.location.href);
    
    // Check if opened from Bitrix24
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuth = urlParams.get("AUTH_ID") || urlParams.get("APP_SID");
    console.log("[AkmeSlot] Has auth params:", !!hasAuth);
    
    if (!hasAuth) {
      console.warn("[AkmeSlot] No auth params - app opened directly");
      this.showError("Please open this app from Bitrix24 menu.<br>Direct links are not supported.");
      return;
    }
    
    if (typeof BX24 === "undefined") {
      console.error("[AkmeSlot] BX24 not found");
      this.showError("Bitrix24 SDK not loaded.");
      return;
    }
    
    console.log("[AkmeSlot] BX24 found, waiting for init...");
    
    // BX24.init with timeout
    let initTimeout;
    const initPromise = new Promise((resolve, reject) => {
      initTimeout = setTimeout(() => {
        reject(new Error("BX24.init timeout - app not opened from Bitrix24"));
      }, 10000);
      
      BX24.init(() => {
        clearTimeout(initTimeout);
        console.log("[AkmeSlot] BX24.init success");
        resolve();
      });
    });
    
    try {
      await initPromise;
      this.loadApp();
    } catch (e) {
      console.error("[AkmeSlot] Init failed:", e);
      this.showError(e.message);
    }
  }

  async loadApp() {
    this.root.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100vh'><div style='text-align:center'><div style='font-size:40px;margin-bottom:20px'>⏳</div><p>Loading...</p></div></div>";
    
    try {
      console.log("[AkmeSlot] Getting user...");
      this.bxUser = await this.callBX("user.current");
      console.log("[AkmeSlot] User:", this.bxUser);
      
      this.user = {
        id: this.bxUser.ID,
        name: this.bxUser.NAME + " " + this.bxUser.LAST_NAME
      };
      
      await this.loadResources();
      this.render();
    } catch (e) {
      console.error("[AkmeSlot] Error:", e);
      this.showError("Error: " + e.message);
    }
  }

  callBX(method, params) {
    params = params || {};
    return new Promise((resolve, reject) => {
      BX24.callMethod(method, params, (result) => {
        if (result.error()) {
          const error = result.error();
          console.error("[AkmeSlot] BX24 error:", error);
          reject(new Error(error.ex.error_message || "BX24 Error"));
        } else {
          resolve(result.data());
        }
      });
    });
  }

  async loadResources() {
    this.resources = [
      { id: "mr_101", name: "Meeting Room 101", type: "meeting_room" },
      { id: "mr_102", name: "Meeting Room 102", type: "meeting_room" },
      { id: "wp_a1", name: "Workplace A1", type: "workplace" },
      { id: "car_001", name: "Toyota Camry", type: "car" }
    ];
  }

  render() {
    const filtered = this.filterType ? this.resources.filter(r => r.type === this.filterType) : this.resources;
    const userName = this.user ? this.user.name : "User";
    
    let html = "<div style='display:flex;height:100vh;font-family:Arial,sans-serif'>";
    html += "<aside style='width:250px;background:#fff;border-right:1px solid #e2e8f0'>";
    html += "<div style='padding:20px'><h1 style='color:#4f46e5;font-size:20px;font-weight:bold;margin:0'>AKMESLOT</h1></div>";
    html += "<nav>" + this.renderNav() + "</nav>";
    html += "<div style='padding:15px;border-top:1px solid #e2e8f0;font-size:14px'><strong>User:</strong><br>" + userName + "</div>";
    html += "</aside>";
    html += "<main style='flex:1;padding:30px;overflow-y:auto;background:#f8fafc'>";
    html += "<h2 style='margin-top:0;color:#1e293b'>" + this.getCategoryName(this.filterType) + "</h2>";
    html += "<div style='display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px'>" + filtered.map(res => this.renderCard(res)).join("") + "</div>";
    html += "</main>";
    html += "</div>";
    this.root.innerHTML = html;
  }

  renderNav() {
    const items = [
      { id: null, label: "All Resources" },
      { id: "meeting_room", label: "Meeting Rooms" },
      { id: "workplace", label: "Workplaces" },
      { id: "car", label: "Cars" }
    ];
    return items.map(item => {
      const isActive = this.filterType === item.id;
      const bg = isActive ? "background:#eef2ff;color:#4f46e5" : "";
      return "<a href='#' onclick='app.setFilter(" + JSON.stringify(item.id || "") + ")' style='display:block;padding:12px 20px;text-decoration:none;color:#334155;font-size:14px;border-bottom:1px solid #f1f5f9;" + bg + "'>" + item.label + "</a>";
    }).join("");
  }

  renderCard(res) {
    return "<div onclick='app.selectResource(" + JSON.stringify(res.id) + ")' style='background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.1)'>" +
      "<h4 style='margin:0 0 8px 0;color:#1e293b;font-size:16px'>" + res.name + "</h4>" +
      "<div style='font-size:12px;color:#64748b;text-transform:uppercase'>" + res.type + "</div>" +
      "</div>";
  }

  setFilter(type) {
    this.filterType = type || null;
    this.render();
  }

  selectResource(id) {
    this.selectedResource = this.resources.find(r => r.id === id);
    alert("Selected: " + this.selectedResource.name);
  }

  getCategoryName(type) {
    const names = { meeting_room: "Meeting Rooms", workplace: "Workplaces", car: "Cars" };
    return names[type] || "All Resources";
  }

  showError(message) {
    this.root.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100vh;background:#fef2f2'><div style='text-align:center;padding:40px'><div style='font-size:60px;margin-bottom:20px'>⚠️</div><h2 style='color:#dc2626;margin:0 0 10px 0'>Error</h2><p style='color:#991b1b;margin:0'>" + message + "</p></div></div>";
  }
}

const app = new AkmeSlotApp();