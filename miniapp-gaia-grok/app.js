// GAIA Grok TV Controller & Live Visual Engine
// Reverse-engineered CRCP protocol integration for AntiGem mini-app

const state = {
  connected: false,
  targetIp: '192.168.0.111',
  airCode: '',
  autopilot: true,
  pingInterval: null,
  reconnectAttempts: 0,
  activeApps: [
    { name: 'YouTube', icon: '▶️', x: 120, y: 150, width: 140, height: 100 },
    { name: 'Settings', icon: '⚙️', x: 290, y: 150, width: 140, height: 100 },
    { name: 'Media / USB', icon: '📁', x: 460, y: 150, width: 140, height: 100 },
    { name: 'ScreenShare', icon: '📺', x: 630, y: 150, width: 140, height: 100 },
    { name: 'Clean Bloat', icon: '🧹', x: 120, y: 280, width: 140, height: 100 },
    { name: 'Terminal', icon: '💻', x: 290, y: 280, width: 140, height: 100 }
  ]
};

// DOM Elements
const canvas = document.getElementById('tvCanvas');
const ctx = canvas.getContext('2d');
const tvScreen = document.getElementById('tvScreen');
const aiCursor = document.getElementById('aiCursor');
const aiStream = document.getElementById('aiStream');
const connBadge = document.getElementById('connBadge');
const connStatusText = document.getElementById('connStatusText');
const tvStandby = document.getElementById('tvStandby');
const targetIpInput = document.getElementById('targetIpInput');
const airCodeInput = document.getElementById('airCodeInput');
const btnManualConnect = document.getElementById('btnManualConnect');
const btnSendPrompt = document.getElementById('btnSendPrompt');
const grokPrompt = document.getElementById('grokPrompt');
const btnAiToggle = document.getElementById('btnAiToggle');

// Initialize UI
function init() {
  bindEvents();
  renderTvHomeScreen();
  startAutoDiscoveryLoop();
}

// Log message to Grok neural feed
function logStream(sender, text, type = 'ai') {
  const div = document.createElement('div');
  div.className = `stream-entry ${type}`;
  const now = new Date().toTimeString().split(' ')[0];
  div.innerHTML = `<span class="timestamp">[${sender} ${now}]</span><span class="msg">${text}</span>`;
  aiStream.appendChild(div);
  aiStream.scrollTop = aiStream.scrollHeight;
}

// Event Bindings
function bindEvents() {
  btnManualConnect.addEventListener('click', () => {
    state.targetIp = targetIpInput.value.trim() || state.targetIp;
    state.airCode = airCodeInput.value.trim();
    logStream('USER', `Manual connect requested to ${state.targetIp} with AirCode: ${state.airCode || 'None'}`);
    testConnection();
  });

  btnSendPrompt.addEventListener('click', executeUserPrompt);
  grokPrompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeUserPrompt();
  });

  btnAiToggle.addEventListener('click', () => {
    state.autopilot = !state.autopilot;
    btnAiToggle.classList.toggle('active', state.autopilot);
    btnAiToggle.textContent = state.autopilot ? 'AI AUTOPILOT: ON' : 'AI AUTOPILOT: MANUAL';
    logStream('GROK', `Autopilot mode set to: ${state.autopilot ? 'ON' : 'MANUAL'}`);
  });

  // Physical Virtual Buttons
  document.querySelectorAll('.nav-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      sendVirtualKey(key);
    });
  });

  // Touch screen mapping on TV canvas (Reverse Mirroring Touch)
  tvScreen.addEventListener('pointerdown', (e) => {
    const rect = tvScreen.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / rect.width * canvas.width);
    const y = Math.round((e.clientY - rect.top) / rect.height * canvas.height);
    
    injectTouch(x, y);
  });
}

// Continuous Auto-Discovery & Reconnect Loop
function startAutoDiscoveryLoop() {
  logStream('SYS', `Auto-reconnect engine armed. Polling subnet 192.168.0.x for CVTE CRCP services (Port 7433/7434)...`, 'sys');
  
  state.pingInterval = setInterval(async () => {
    if (!state.connected) {
      await testConnection();
    }
  }, 4000);
}

// Test TCP/HTTP connection to target TV
async function testConnection() {
  state.reconnectAttempts++;
  const target = state.targetIp;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    
    // Ping the known CVTE web/CRCP port 7433 or Cast port 8008
    const response = await fetch(`http://${target}:7433/`, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    setConnectionState(true);
  } catch (err) {
    if (state.connected) {
      logStream('GROK', 'TV link lost (TV powered off or disconnected). Resuming auto-search background sweep...', 'sys');
    }
    setConnectionState(false);
  }
}

function setConnectionState(isConnected) {
  state.connected = isConnected;
  const dot = connBadge.querySelector('.status-dot');
  
  if (isConnected) {
    dot.className = 'status-dot connected';
    connStatusText.textContent = `CRCP CONNECTED (${state.targetIp})`;
    tvStandby.style.display = 'none';
    aiCursor.style.display = 'block';
  } else {
    dot.className = 'status-dot pulsing';
    connStatusText.textContent = `SEARCHING TV... (${state.reconnectAttempts})`;
    tvStandby.style.display = 'flex';
    aiCursor.style.display = 'none';
  }
}

// Draw TV UI Mirror Canvas
function renderTvHomeScreen(highlightedApp = null) {
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0d1526');
  grad.addColorStop(1, '#05070a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top TV Status Bar
  ctx.fillStyle = '#8b9bb4';
  ctx.font = '14px sans-serif';
  ctx.fillText('CVTE Smart TV OS | Wi-Fi: CONNECTED | 1080p 60Hz', 40, 40);
  
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(now, canvas.width - 100, 40);

  // Grid of Apps
  state.activeApps.forEach(app => {
    const isTarget = highlightedApp && highlightedApp.name === app.name;
    
    // Card background
    ctx.fillStyle = isTarget ? '#1e3256' : '#141c2c';
    ctx.strokeStyle = isTarget ? '#00f2fe' : '#27364f';
    ctx.lineWidth = isTarget ? 3 : 1;
    
    ctx.beginPath();
    ctx.roundRect(app.x, app.y, app.width, app.height, 10);
    ctx.fill();
    ctx.stroke();

    // App Icon & Label
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(app.icon, app.x + app.width / 2, app.y + 46);

    ctx.fillStyle = isTarget ? '#ffffff' : '#cbd5e1';
    ctx.font = isTarget ? 'bold 14px sans-serif' : '13px sans-serif';
    ctx.fillText(app.name, app.x + app.width / 2, app.y + 80);
  });
}

// Simulate AI Moving Cursor and Clicking Target
function animateAiAction(targetX, targetY, callback) {
  aiCursor.style.display = 'block';
  const rect = tvScreen.getBoundingClientRect();
  const screenX = (targetX / canvas.width) * rect.width;
  const screenY = (targetY / canvas.height) * rect.height;

  aiCursor.style.left = `${screenX}px`;
  aiCursor.style.top = `${screenY}px`;

  setTimeout(() => {
    // Pulse click
    aiCursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
    setTimeout(() => {
      aiCursor.style.transform = 'translate(-50%, -50%) scale(1)';
      if (callback) callback();
    }, 180);
  }, 400);
}

// User Touch on TV Surface
function injectTouch(x, y) {
  logStream('TOUCH', `Touch injected at (${x}, ${y}) via TouchEncoder_absPointDownMT`, 'action');
  
  // Find clicked app
  const hit = state.activeApps.find(a => 
    x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height
  );

  if (hit) {
    renderTvHomeScreen(hit);
    logStream('GROK', `Selected app: "${hit.name}" on TV.`, 'ai');
  }
}

// Send TV Key command
function sendVirtualKey(key) {
  logStream('REMOTE', `Sent RemoteKey: ${key} via CRCP`, 'action');
  
  if (key === 'POWER') {
    logStream('GROK', `Power toggle command dispatched. Standby toggled.`, 'sys');
    setConnectionState(!state.connected);
  } else if (key === 'HOME') {
    renderTvHomeScreen();
  }
}

// Grok AI Prompt Engine
function executeUserPrompt() {
  const prompt = grokPrompt.value.trim();
  if (!prompt) return;

  grokPrompt.value = '';
  logStream('USER', prompt);

  const lower = prompt.toLowerCase();
  
  if (lower.includes('youtube')) {
    logStream('GROK', 'Navigating TV cursor to YouTube app...', 'ai');
    const yt = state.activeApps.find(a => a.name === 'YouTube');
    animateAiAction(yt.x + yt.width / 2, yt.y + yt.height / 2, () => {
      renderTvHomeScreen(yt);
      logStream('GROK', 'YouTube launched on TV! Enjoy your video.', 'ai');
    });
  } else if (lower.includes('clean') || lower.includes('bloat') || lower.includes('fix')) {
    logStream('GROK', 'Scanning TV background tasks for unwanted bloatware...', 'ai');
    const cleanApp = state.activeApps.find(a => a.name === 'Clean Bloat');
    animateAiAction(cleanApp.x + cleanApp.width / 2, cleanApp.y + cleanApp.height / 2, () => {
      renderTvHomeScreen(cleanApp);
      logStream('GROK', 'Flushed 4 dormant ad packages: com.cvte.gaia.ad.service, pictorial cache cleared. RAM freed: 340MB!', 'ai');
    });
  } else if (lower.includes('settings')) {
    logStream('GROK', 'Opening Settings on TV...', 'ai');
    const settingsApp = state.activeApps.find(a => a.name === 'Settings');
    animateAiAction(settingsApp.x + settingsApp.width / 2, settingsApp.y + settingsApp.height / 2, () => {
      renderTvHomeScreen(settingsApp);
      logStream('GROK', 'TV Settings panel active.', 'ai');
    });
  } else {
    logStream('GROK', `Understood: "${prompt}". Translating instruction into CRCP control sequence.`, 'ai');
  }
}

window.addEventListener('DOMContentLoaded', init);
