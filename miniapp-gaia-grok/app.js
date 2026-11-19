// GrokBot Autonomous Computer Use & TV Automation Engine
// Manual Mode Active: Direct Canvas Interaction & Manual IP Target

const appState = {
  connected: true, // Always ready in manual mode
  targetIp: '192.168.0.111',
  airCode: '',
  activeBot: 'tv-agent',
  humanTakeover: true, // Manual direct touch active
  tvApps: [
    { id: 'yt', name: 'YouTube', icon: '▶️', x: 100, y: 130, w: 140, h: 100 },
    { id: 'settings', name: 'Settings', icon: '⚙️', x: 260, y: 130, w: 140, h: 100 },
    { id: 'media', name: 'Media Files', icon: '📁', x: 420, y: 130, w: 140, h: 100 },
    { id: 'screenshare', name: 'ScreenShare', icon: '📺', x: 580, y: 130, w: 140, h: 100 },
    { id: 'cleaner', name: 'System Cleaner', icon: '🧹', x: 100, y: 260, w: 140, h: 100 },
    { id: 'browser', name: 'Web Browser', icon: '🌐', x: 260, y: 260, w: 140, h: 100 },
    { id: 'deviceinfo', name: 'Device Info', icon: 'ℹ️', x: 420, y: 260, w: 140, h: 100 },
    { id: 'terminal', name: 'Termux', icon: '💻', x: 580, y: 260, w: 140, h: 100 }
  ]
};

// DOM Elements
const canvas = document.getElementById('tvDisplay');
const ctx = canvas.getContext('2d');
const tvViewport = document.getElementById('tvViewport');
const aiCursor = document.getElementById('aiCursor');
const clickRipple = document.getElementById('clickRipple');
const connLabel = document.getElementById('connLabel');
const chatFeed = document.getElementById('chatFeed');
const userInput = document.getElementById('userInput');
const btnSend = document.getElementById('btnSend');
const btnTakeover = document.getElementById('btnTakeover');
const takeoverText = document.getElementById('takeoverText');
const btnToggleDisplay = document.getElementById('btnToggleDisplay');
const manualIpInput = document.getElementById('manualIpInput');
const manualPinInput = document.getElementById('manualPinInput');
const btnConnectManual = document.getElementById('btnConnectManual');
const currentBotTitle = document.getElementById('currentBotTitle');

function init() {
  bindEvents();
  renderTvScreen();
  appendGrokMessage('Manual Direct mode engaged! The TV viewport is completely active. You can tap the screen, press remote keys, or enter a target IP on the left.');
}

function bindEvents() {
  btnSend.addEventListener('click', handleUserMessage);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleUserMessage();
    }
  });

  btnTakeover.addEventListener('click', toggleManualTakeover);
  
  if (btnConnectManual) {
    btnConnectManual.addEventListener('click', () => {
      appState.targetIp = manualIpInput.value.trim() || appState.targetIp;
      appState.airCode = manualPinInput.value.trim();
      connLabel.textContent = `Target: ${appState.targetIp}`;
      appendActionCard('TARGET CONFIGURED', `TV IP set to <strong>${appState.targetIp}</strong>${appState.airCode ? ` | PIN: ${appState.airCode}` : ''}`);
    });
  }

  if (btnToggleDisplay) {
    btnToggleDisplay.addEventListener('click', () => {
      renderTvScreen();
      appendSystemLog('Refreshed TV display buffer.');
    });
  }

  // Suggestion Chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      userInput.value = chip.dataset.prompt;
      handleUserMessage();
    });
  });

  // Bot roster item selection
  document.querySelectorAll('.roster-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.roster-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      appState.activeBot = item.dataset.bot;
      const botName = item.querySelector('.name').textContent;
      currentBotTitle.textContent = `GrokBot / ${botName}`;
      appendGrokMessage(`Switched active agent to <strong>${botName}</strong>.`);
    });
  });

  // Mode Chips
  document.querySelectorAll('.mode-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mode-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  // Virtual Remote Buttons
  document.querySelectorAll('.pill-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      sendKeyCommand(key);
    });
  });

  // Direct Screen Touch / Interactive Click
  tvViewport.addEventListener('pointerdown', (e) => {
    const rect = tvViewport.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / rect.width * canvas.width);
    const y = Math.round((e.clientY - rect.top) / rect.height * canvas.height);

    injectTouch(x, y, e.clientX - rect.left, e.clientY - rect.top);
  });
}

function toggleManualTakeover() {
  appState.humanTakeover = !appState.humanTakeover;
  btnTakeover.classList.toggle('active', appState.humanTakeover);
  takeoverText.textContent = appState.humanTakeover ? 'Manual Control: ON' : 'AI Autopilot: ON';

  if (appState.humanTakeover) {
    appendGrokMessage('Manual control active: Tap the TV screen directly or use the remote buttons.');
  } else {
    appendGrokMessage('AI Autopilot active: I will take over cursor navigation.');
  }
}

// Render TV Desktop
function renderTvScreen(activeApp = null) {
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gradient backdrop
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#05070b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // TV Header Bar
  ctx.fillStyle = '#6b7c96';
  ctx.font = '13px sans-serif';
  ctx.fillText(`CVTE SMART TV OS | ${appState.targetIp} | 1080P @ 60Hz`, 36, 40);

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(timeStr, canvas.width - 80, 40);

  // Apps
  appState.tvApps.forEach(app => {
    const isSelected = activeApp && activeApp.id === app.id;

    ctx.fillStyle = isSelected ? '#1e3354' : '#141c2b';
    ctx.strokeStyle = isSelected ? '#00f2fe' : '#222f44';
    ctx.lineWidth = isSelected ? 2.5 : 1;

    ctx.beginPath();
    ctx.roundRect(app.x, app.y, app.w, app.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(app.icon, app.x + app.w / 2, app.y + 46);

    ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
    ctx.font = isSelected ? 'bold 13px sans-serif' : '12px sans-serif';
    ctx.fillText(app.name, app.x + app.w / 2, app.y + 78);
  });
}

// Trigger Click Ripple Effect
function triggerRipple(screenX, screenY) {
  clickRipple.style.left = `${screenX}px`;
  clickRipple.style.top = `${screenY}px`;
  clickRipple.classList.remove('animate');
  void clickRipple.offsetWidth;
  clickRipple.classList.add('animate');
}

// Grok Computer-Use: Move Cursor & Click Element
function moveCursorAndAct(targetX, targetY, actionDesc, callback) {
  aiCursor.style.display = 'flex';
  const rect = tvViewport.getBoundingClientRect();
  const screenX = (targetX / canvas.width) * rect.width;
  const screenY = (targetY / canvas.height) * rect.height;

  aiCursor.style.left = `${screenX}px`;
  aiCursor.style.top = `${screenY}px`;

  appendActionCard('COMPUTER USE ACTION', `Moving pointer to (${targetX}, ${targetY}) → ${actionDesc}`);

  setTimeout(() => {
    aiCursor.style.transform = 'scale(0.85)';
    triggerRipple(screenX, screenY);
    setTimeout(() => {
      aiCursor.style.transform = 'scale(1)';
      if (callback) callback();
    }, 150);
  }, 350);
}

// User Touch Handling
function injectTouch(x, y, clientX, clientY) {
  triggerRipple(clientX, clientY);
  const hit = appState.tvApps.find(a => x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h);
  if (hit) {
    renderTvScreen(hit);
    appendActionCard('TOUCH INJECTED', `Direct tap at (${x}, ${y}) → Launched <strong>${hit.name}</strong>`);
  } else {
    appendActionCard('TOUCH INJECTED', `Touch coordinate: (${x}, ${y})`);
  }
}

function sendKeyCommand(key) {
  appendActionCard('REMOTE COMMAND', `Dispatched RemoteKey.${key} via CRCP`);
  if (key === 'HOME') renderTvScreen();
  else if (key === 'POWER') {
    appendSystemLog('Standby command dispatched to TV.');
  }
}

// Grok Chat Logic
function handleUserMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = '';
  appendUserMessage(text);

  const lower = text.toLowerCase();
  if (lower.includes('youtube')) {
    const yt = appState.tvApps.find(a => a.id === 'yt');
    moveCursorAndAct(yt.x + yt.w / 2, yt.y + yt.h / 2, 'Clicking YouTube', () => {
      renderTvScreen(yt);
      appendGrokMessage('YouTube launched on the TV viewport!');
    });
  } else if (lower.includes('clean') || lower.includes('bloat') || lower.includes('fix')) {
    const cleaner = appState.tvApps.find(a => a.id === 'cleaner');
    moveCursorAndAct(cleaner.x + cleaner.w / 2, cleaner.y + cleaner.h / 2, 'Triggering System Cleaner', () => {
      renderTvScreen(cleaner);
      appendGrokMessage('Executed debloat routine: Flushed <strong>com.cvte.gaia.ad.service</strong> and freed 380MB of RAM.');
    });
  } else if (lower.includes('setting')) {
    const settings = appState.tvApps.find(a => a.id === 'settings');
    moveCursorAndAct(settings.x + settings.w / 2, settings.y + settings.h / 2, 'Opening TV Settings', () => {
      renderTvScreen(settings);
      appendGrokMessage('Settings panel opened.');
    });
  } else if (lower.includes('media') || lower.includes('file')) {
    const media = appState.tvApps.find(a => a.id === 'media');
    moveCursorAndAct(media.x + media.w / 2, media.y + media.h / 2, 'Opening Media Browser', () => {
      renderTvScreen(media);
      appendGrokMessage('Media Browser opened.');
    });
  } else {
    appendGrokMessage(`Received instruction: "<em>${text}</em>". Translated into direct CRCP control sequence.`);
  }
}

function appendUserMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'message-block user';
  msg.textContent = text;
  chatFeed.appendChild(msg);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function appendGrokMessage(htmlContent) {
  const block = document.createElement('div');
  block.className = 'message-block grok';
  block.innerHTML = `
    <div class="msg-header">
      <span class="grok-pill">GROK</span>
      <span class="msg-time">Just now</span>
    </div>
    <div class="msg-body">${htmlContent}</div>
  `;
  chatFeed.appendChild(block);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function appendSystemLog(text) {
  const block = document.createElement('div');
  block.className = 'message-block system';
  block.innerHTML = text;
  chatFeed.appendChild(block);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

function appendActionCard(title, details) {
  const card = document.createElement('div');
  card.className = 'action-step-card';
  card.innerHTML = `<div class="step-title">${title}</div><div>${details}</div>`;
  chatFeed.appendChild(card);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

window.addEventListener('DOMContentLoaded', init);
