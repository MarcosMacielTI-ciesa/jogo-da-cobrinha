// script.js - single clean implementation
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Elementos da UI
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const bestScoreDisplay = document.getElementById("bestScore");
const playerDisplay = document.getElementById("playerDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const nameModal = document.getElementById("nameModal");
const playerNameInput = document.getElementById("playerName");
const confirmNameBtn = document.getElementById("confirmNameBtn");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const upBtn1 = document.getElementById("upBtn1");
const downBtn1 = document.getElementById("downBtn1");
const leftBtn1 = document.getElementById("leftBtn1");
const rightBtn1 = document.getElementById("rightBtn1");
const controlModal = document.getElementById("controlModal");
const swipeOverlay = document.getElementById("swipeOverlay");
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const soundToggle = document.getElementById('soundToggle');
const soundVolume = document.getElementById('soundVolume');
const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");

// Dificuldades e velocidade base (ms)
let currentDifficulty = 'medium';
const DIFF_BASE_SPEED = { easy: 140, medium: 100, hard: 60 };

// Cores de destaque por dificuldade (mantém consistência com CSS)
const ACCENT_COLORS = { easy: '#4cd964', medium: '#ffd60a', hard: '#ff4d4f' };

function hexToRgba(hex, alpha) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Sistema de Scores (LocalStorage)
let currentPlayer = "";
let bestScore = 0;

function getScoreKey(playerName, difficulty) {
  return `snake_score_${difficulty}_${playerName}`;
}

function getPlayerScores(playerName, difficulty = currentDifficulty) {
  if (!playerName) return 0;
  const key = getScoreKey(playerName, difficulty);
  const data = localStorage.getItem(key);
  return data ? parseInt(data, 10) : 0;
}

function savePlayerScore(playerName, points, difficulty = currentDifficulty) {
  if (!playerName) return;
  const key = getScoreKey(playerName, difficulty);
  localStorage.setItem(key, points);
}

function getAllScores(difficulty) {
  const prefix = `snake_score_${difficulty}_`;
  const list = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(prefix)) {
      const name = key.slice(prefix.length);
      const val = parseInt(localStorage.getItem(key), 10) || 0;
      list.push({ name, score: val });
    }
  }
  return list;
}

function renderLeaderboardFor(difficulty, limit = 5) {
  const tableId = `#leaderboard_${difficulty}`;
  const tbody = document.querySelector(`${tableId} tbody`);
  if (!tbody) return;
  const scores = getAllScores(difficulty).sort((a, b) => b.score - a.score).slice(0, limit);
  tbody.innerHTML = '';
  if (scores.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:rgba(255,255,255,0.7)">Sem pontuações ainda</td></tr>';
    return;
  }
  scores.forEach((entry, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${idx + 1}</td><td>${entry.name}</td><td>${entry.score}</td>`;
    tbody.appendChild(tr);
  });
}

function renderAllLeaderboards() {
  ['easy', 'medium', 'hard'].forEach(d => renderLeaderboardFor(d));
}

function loadPlayerName() {
  const savedName = localStorage.getItem("snake_player_name");
  if (savedName && savedName.trim() !== "") {
    currentPlayer = savedName;
    bestScore = getPlayerScores(currentPlayer, currentDifficulty);
    hideNameModal();
    updatePlayerDisplay();
  } else {
    showNameModal();
  }
}

function showNameModal() {
  nameModal.classList.remove("hidden");
  playerNameInput.focus();
}

function hideNameModal() {
  nameModal.classList.add("hidden");
}

function confirmPlayerName() {
  const name = playerNameInput.value.trim();
  console.log('confirmPlayerName ->', name);
  if (name === "") {
    alert("Por favor, digite um nome!");
    return;
  }
  currentPlayer = name;
  localStorage.setItem("snake_player_name", currentPlayer);
  bestScore = getPlayerScores(currentPlayer, currentDifficulty);
  hideNameModal();
  updatePlayerDisplay();
  renderAllLeaderboards();
  // abrir seleção de controles antes de iniciar
  showControlSelection();
}

function showControlSelection() {
  if (!controlModal) return;
  controlModal.classList.remove('hidden');
}

function hideControlSelection() {
  if (!controlModal) return;
  controlModal.classList.add('hidden');
}

let selectedControl = 'type2';
function applyControlType(type) {
  selectedControl = type;
  // mostrar/ocultar layouts
  const t1 = document.getElementById('controlsType1');
  const t2 = document.getElementById('controlsType2');
  if (t1) t1.classList.toggle('hidden', type !== 'type1');
  if (t2) t2.classList.toggle('hidden', type !== 'type2');
  if (swipeOverlay) swipeOverlay.classList.toggle('hidden', type !== 'swipe');
  // atualizar visual dos cartões
  document.querySelectorAll('.choose-control-btn').forEach(btn => {
    const ctrl = btn.getAttribute('data-control');
    const card = btn.closest('.control-card');
    if (!card) return;
    if (ctrl === type) {
      card.classList.add('active');
      btn.classList.add('active');
      btn.textContent = 'Ativado';
    } else {
      card.classList.remove('active');
      btn.classList.remove('active');
      btn.textContent = 'Escolher';
    }
  });

  // sincronizar com modal de configurações (radio)
  const radio = document.querySelector(`input[name="ctrlType"][value="${type}"]`);
  if (radio) radio.checked = true;

  // persistir imediatamente
  saveSettings();

  hideControlSelection();
}

function updateControlStatusVisuals() {
  const onPath = 'img/toggle_on.png';
  const offPath = 'img/toggle_off.png';
  document.querySelectorAll('.choose-control-btn').forEach(btn => {
    const ctrl = btn.getAttribute('data-control');
    const card = btn.closest('.control-card');
    if (!card) return;
    const statusImg = card.querySelector('.ctrl-status');
    if (!statusImg) return;
    if (ctrl === selectedControl) {
      statusImg.src = onPath;
      statusImg.alt = 'Status: conectado';
      btn.classList.add('active');
      card.classList.add('active');
      btn.textContent = 'Ativado';
    } else {
      statusImg.src = offPath;
      statusImg.alt = 'Status: não conectado';
      btn.classList.remove('active');
      card.classList.remove('active');
      btn.textContent = 'Escolher';
    }
  });
}

// update visuals when settings loaded or control changed
const origApplyControlType = applyControlType;
applyControlType = function(type) {
  origApplyControlType(type);
  updateControlStatusVisuals();
};

// Detectar cliques nas opções do modal (botão 'Escolher') e abrir/fechar configurações
document.addEventListener('click', (e) => {
  const chooseEl = e.target.closest && e.target.closest('.choose-control-btn');
  if (chooseEl) {
    const t = chooseEl.getAttribute('data-control');
    if (t) applyControlType(t);
  }
  // settings open/close
  const settingsOpen = e.target.closest && e.target.closest('#settingsBtn');
  if (settingsOpen) {
    if (settingsModal) settingsModal.classList.remove('hidden');
  }
  const settingsClose = e.target.closest && e.target.closest('#closeSettingsBtn');
  if (settingsClose) {
    if (settingsModal) settingsModal.classList.add('hidden');
  }
});

function updatePlayerDisplay() {
  playerDisplay.textContent = `Jogador: ${currentPlayer}`;
  bestScoreDisplay.textContent = bestScore;
}

// Ajustar tamanho do canvas responsivamente
function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const size = Math.min(wrapper.clientWidth - 10, 400);
  canvas.width = size;
  canvas.height = size;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Configurações do jogo
const GRID = 20;
let box;
let snake = [];
let direction = "right";
let nextDirection = "right";
let food = { x: 0, y: 0 };
let score = 0;
let level = 1;
let gameSpeed = DIFF_BASE_SPEED[currentDifficulty];
let gamePaused = false;
let gameRunning = false;
let gameOver = false;
let gameInterval;

function initGame() {
  box = canvas.width / GRID;
  snake = [{ x: Math.floor(GRID / 2), y: Math.floor(GRID / 2) }];
  direction = "right";
  nextDirection = "right";
  score = 0;
  level = 1;
  gameSpeed = DIFF_BASE_SPEED[currentDifficulty] || 100;
  gamePaused = false;
  gameOver = false;
  generateFood();
  updateDisplay();
}

function generateFood() {
  let fx, fy, tries = 0;
  do {
    fx = Math.floor(Math.random() * GRID);
    fy = Math.floor(Math.random() * GRID);
    tries++;
    if (tries > 1000) break;
  } while (snake.some(s => s.x === fx && s.y === fy));
  food = { x: fx, y: fy };
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  if (score > bestScore) {
    bestScore = score;
    bestScoreDisplay.textContent = bestScore;
    savePlayerScore(currentPlayer, bestScore, currentDifficulty);
  }
  renderAllLeaderboards();
}

function startGame() {
  console.log('startGame called, gameRunning=', gameRunning, 'gameSpeed=', gameSpeed);
  if (!gameRunning) {
    gameRunning = true;
    gameOver = false;
    startBtn.disabled = true;
    startBtn.textContent = "▶ Iniciar";
    pauseBtn.disabled = false;
    gameInterval = setInterval(draw, gameSpeed);
  }
}

function restartGameFromButton() {
  if (gameOver) {
    restartGame();
  } else {
    startGame();
  }
}

function pauseGame() {
  if (gameRunning && !gameOver) {
    gamePaused = !gamePaused;
    if (gamePaused) {
      clearInterval(gameInterval);
      pauseBtn.textContent = "▶ Retomar";
    } else {
      pauseBtn.textContent = "⏸ Pausar";
      gameInterval = setInterval(draw, gameSpeed);
    }
  }
}

function restartGame() {
  clearInterval(gameInterval);
  gameRunning = false;
  gamePaused = false;
  gameOver = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = "⏸ Pausar";
  initGame();
  draw();
}

function endGame() {
  gameRunning = false;
  gameOver = true;
  clearInterval(gameInterval);
  pauseBtn.disabled = true;
  startBtn.disabled = false;
  startBtn.textContent = "▶ RECOMEÇA";
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f0";
  ctx.font = `bold ${canvas.width * 0.08}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = `${canvas.width * 0.05}px Arial`;
  ctx.fillText(`Pontos: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText(`Nível: ${level}`, canvas.width / 2, canvas.height / 2 + 60);
}

function draw() {
  if (gamePaused) return;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    const pos = i * box;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
  // use theme accent for subtle grid lines
  ctx.strokeStyle = hexToRgba(ACCENT_COLORS[currentDifficulty] || '#00ff00', 0.08);
  drawFood();
  direction = nextDirection;
  let head = { ...snake[0] };
  if (direction === "up") head.y -= 1;
  if (direction === "down") head.y += 1;
  if (direction === "left") head.x -= 1;
  if (direction === "right") head.x += 1;
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    playEventSound('gameover');
    endGame();
    return;
  }
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    playEventSound('gameover');
    endGame();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    playEventSound('eat');
    const newLevel = Math.floor(score / 5) + 1;
    if (newLevel !== level) {
      level = newLevel;
      const minSpeed = 30;
      const base = DIFF_BASE_SPEED[currentDifficulty] || 100;
      gameSpeed = Math.max(minSpeed, base - (level - 1) * 8);
      clearInterval(gameInterval);
      gameInterval = setInterval(draw, gameSpeed);
    }
    generateFood();
    updateDisplay();
  } else {
    snake.pop();
  }
  drawSnake();
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const isHead = i === 0;
    const segment = snake[i];
    const px = segment.x * box;
    const py = segment.y * box;
    if (isHead) {
        const accent = ACCENT_COLORS[currentDifficulty] || '#00ff00';
        ctx.fillStyle = accent;
        ctx.shadowColor = hexToRgba(accent, 0.9);
        ctx.shadowBlur = 10;
      ctx.fillRect(px + 1, py + 1, box - 2, box - 2);
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#000";
      ctx.fillRect(px + box * 0.2, py + box * 0.2, Math.max(2, box * 0.08), Math.max(2, box * 0.08));
      ctx.fillRect(px + box * 0.7, py + box * 0.2, Math.max(2, box * 0.08), Math.max(2, box * 0.08));
    } else {
      const intensity = Math.max(80, 200 - (i * 10));
      // softer body color based on accent (fallback to greenish gradient)
      ctx.fillStyle = hexToRgba(ACCENT_COLORS[currentDifficulty] || '#00ff00', Math.min(1, (200 - i * 6) / 255));
      ctx.fillRect(px + 1, py + 1, box - 2, box - 2);
    }
    ctx.strokeStyle = hexToRgba(ACCENT_COLORS[currentDifficulty] || '#0a0', 0.9);
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, box - 2, box - 2);
  }
}

function drawFood() {
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "rgba(255, 68, 68, 0.8)";
  ctx.shadowBlur = 10;
  const padding = box * 0.1;
  const px = food.x * box;
  const py = food.y * box;
  ctx.fillRect(px + padding, py + padding, box - padding * 2, box - padding * 2);
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#ff7777";
  ctx.lineWidth = Math.max(1, Math.floor(box * 0.08));
  ctx.strokeRect(px + padding, py + padding, box - padding * 2, box - padding * 2);
}

// Controles de teclado
document.addEventListener("keydown", event => {
  if (gameRunning && !gamePaused) {
    if (event.key === "ArrowUp" && direction !== "down") nextDirection = "up";
    if (event.key === "ArrowDown" && direction !== "up") nextDirection = "down";
    if (event.key === "ArrowLeft" && direction !== "right") nextDirection = "left";
    if (event.key === "ArrowRight" && direction !== "left") nextDirection = "right";
  }
  if (event.key === " ") {
    event.preventDefault();
    pauseGame();
  }
});

// Controles de botões da UI
startBtn.addEventListener("click", restartGameFromButton);
pauseBtn.addEventListener("click", pauseGame);
restartBtn.addEventListener("click", restartGame);

// Controles de toque para mobile
function handleMobileInput(dir, event) {
  event.preventDefault();
  if (gameRunning && !gamePaused) {
    if (dir === 'up' && direction !== 'down') nextDirection = 'up';
    if (dir === 'down' && direction !== 'up') nextDirection = 'down';
    if (dir === 'left' && direction !== 'right') nextDirection = 'left';
    if (dir === 'right' && direction !== 'left') nextDirection = 'right';
  }
}

['click','pointerdown','touchstart'].forEach(evt => {
  upBtn.addEventListener(evt, e => handleMobileInput('up', e));
  downBtn.addEventListener(evt, e => handleMobileInput('down', e));
  leftBtn.addEventListener(evt, e => handleMobileInput('left', e));
  rightBtn.addEventListener(evt, e => handleMobileInput('right', e));
  if (upBtn1) upBtn1.addEventListener(evt, e => handleMobileInput('up', e));
  if (downBtn1) downBtn1.addEventListener(evt, e => handleMobileInput('down', e));
  if (leftBtn1) leftBtn1.addEventListener(evt, e => handleMobileInput('left', e));
  if (rightBtn1) rightBtn1.addEventListener(evt, e => handleMobileInput('right', e));
});

// Difficulty buttons
function applyDifficulty(d) {
  currentDifficulty = d;
  [easyBtn, mediumBtn, hardBtn].forEach(b => b && b.classList.remove('active'));
  const btn = { easy: easyBtn, medium: mediumBtn, hard: hardBtn }[d];
  if (btn) btn.classList.add('active');
  document.body.classList.remove('theme-easy','theme-medium','theme-hard');
  document.body.classList.add(`theme-${d}`);
  // expose accent color to CSS
  try { document.documentElement.style.setProperty('--accent-color', ACCENT_COLORS[d]); } catch (e) {}
  if (currentPlayer) {
    bestScore = getPlayerScores(currentPlayer, currentDifficulty);
    updatePlayerDisplay();
  }
  gameSpeed = DIFF_BASE_SPEED[currentDifficulty] || 100;
  clearInterval(gameInterval);
  gameRunning = false;
  gamePaused = false;
}

if (easyBtn) easyBtn.addEventListener('click', () => { applyDifficulty('easy'); });
if (mediumBtn) mediumBtn.addEventListener('click', () => { applyDifficulty('medium'); });
if (hardBtn) hardBtn.addEventListener('click', () => { applyDifficulty('hard'); });

// Inicializar
initGame();
draw();

// Carregar nome do jogador ao iniciar
confirmNameBtn.addEventListener("click", confirmPlayerName);
playerNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") confirmPlayerName();
});

loadPlayerName();
renderAllLeaderboards();
// aplicar tema/dificuldade ativa na inicialização
loadSettings();
applyDifficulty(currentDifficulty);

// --- Swipe / Drag controls ---
let touchStartX = null;
let touchStartY = null;
function onPointerDown(e) {
  const p = (e.touches && e.touches[0]) || e;
  touchStartX = p.clientX;
  touchStartY = p.clientY;
}

function onPointerUp(e) {
  if (touchStartX === null || touchStartY === null) return;
  const p = (e.changedTouches && e.changedTouches[0]) || e;
  const dx = p.clientX - touchStartX;
  const dy = p.clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 30; // pixels
  if (Math.max(absX, absY) > threshold && gameRunning && !gamePaused) {
    if (absX > absY) {
      if (dx > 0 && direction !== 'left') nextDirection = 'right';
      if (dx < 0 && direction !== 'right') nextDirection = 'left';
    } else {
      if (dy > 0 && direction !== 'up') nextDirection = 'down';
      if (dy < 0 && direction !== 'down') nextDirection = 'up';
    }
  }
  touchStartX = null; touchStartY = null;
}

// Conectar swipeOverlay e canvas para capturar gestos quando modo 'swipe' estiver ativo
if (swipeOverlay) {
  ['pointerdown','touchstart','mousedown'].forEach(ev => swipeOverlay.addEventListener(ev, onPointerDown));
  ['pointerup','touchend','mouseup'].forEach(ev => swipeOverlay.addEventListener(ev, onPointerUp));
}

// Por segurança, também permitir swipe direto no canvas
['pointerdown','touchstart'].forEach(ev => canvas.addEventListener(ev, onPointerDown));
['pointerup','touchend'].forEach(ev => canvas.addEventListener(ev, onPointerUp));

// --- Settings: sound + control persistence ---
let soundEnabled = true;
let soundVol = 0.6;

function loadSettings() {
  try {
    const s = localStorage.getItem('snake_settings');
    if (s) {
      const obj = JSON.parse(s);
      selectedControl = obj.control || selectedControl;
      soundEnabled = obj.soundEnabled !== undefined ? obj.soundEnabled : soundEnabled;
      soundVol = obj.soundVol !== undefined ? obj.soundVol : soundVol;
    }
  } catch (err) { console.debug('loadSettings err', err); }
  // apply UI
  applyControlType(selectedControl);
  if (soundToggle) soundToggle.checked = !!soundEnabled;
  if (soundVolume) soundVolume.value = soundVol;
}

function saveSettings() {
  try {
    const obj = { control: selectedControl, soundEnabled: !!soundToggle?.checked, soundVol: parseFloat(soundVolume?.value || soundVol) };
    localStorage.setItem('snake_settings', JSON.stringify(obj));
    soundEnabled = obj.soundEnabled;
    soundVol = obj.soundVol;
  } catch (err) { console.debug('saveSettings err', err); }
}

if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => { saveSettings(); if (settingsModal) settingsModal.classList.add('hidden'); });
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { if (settingsModal) settingsModal.classList.add('hidden'); });

// Simple beep using WebAudio for events
function playBeep(freq = 440, duration = 0.08) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = soundVol;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, duration * 1000);
  } catch (err) { /* ignore */ }
}

// Play sounds on eat and game over
function playEventSound(eventName) {
  if (!soundEnabled) return;
  if (eventName === 'eat') playBeep(880, 0.06);
  if (eventName === 'gameover') playBeep(180, 0.25);
}

// Hook into eating and game over
