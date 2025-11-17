// script.js
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

// Sistema de Scores (LocalStorage)
let currentPlayer = "";
let bestScore = 0;

function getPlayerScores(playerName) {
  const key = `snake_score_${playerName}`;
  const data = localStorage.getItem(key);
  return data ? parseInt(data) : 0;
}

function savePlayerScore(playerName, points) {
  const key = `snake_score_${playerName}`;
  localStorage.setItem(key, points);
}

function loadPlayerName() {
  const savedName = localStorage.getItem("snake_player_name");
  if (savedName && savedName.trim() !== "") {
    currentPlayer = savedName;
    bestScore = getPlayerScores(currentPlayer);
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
  if (name === "") {
    alert("Por favor, digite um nome!");
    return;
  }
  currentPlayer = name;
  localStorage.setItem("snake_player_name", currentPlayer);
  bestScore = getPlayerScores(currentPlayer);
  hideNameModal();
  updatePlayerDisplay();
}

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
let gameSpeed = 100;
let gamePaused = false;
let gameRunning = false;
let gameOver = false;
let gameInterval;

// Inicializar jogo
function initGame() {
  // recalcula o tamanho da célula (em pixels) baseado no canvas atual
  box = canvas.width / GRID;

  // inicializa a cobra no centro da grade (usando coordenadas inteiras)
  snake = [{ x: Math.floor(GRID / 2), y: Math.floor(GRID / 2) }];
  direction = "right";
  nextDirection = "right";
  score = 0;
  level = 1;
  gameSpeed = 100;
  gamePaused = false;
  gameOver = false;
  generateFood();
  updateDisplay();
}

function generateFood() {
  // gera uma posição que não esteja ocupada pela cobra
  let fx, fy, tries = 0;
  do {
    fx = Math.floor(Math.random() * GRID);
    fy = Math.floor(Math.random() * GRID);
    tries++;
    if (tries > 1000) break; // segurança
  } while (snake.some(s => s.x === fx && s.y === fy));

  food = { x: fx, y: fy };
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  
  // Atualizar melhor score se bateu recorde
  if (score > bestScore) {
    bestScore = score;
    bestScoreDisplay.textContent = bestScore;
    savePlayerScore(currentPlayer, bestScore);
  }
}

function startGame() {
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
  // função chamada quando clica em Iniciar após game over
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

  // Limpar canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenhar grid
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

  // Desenhar comida com efeito (em coordenadas de pixels)
  drawFood();

  // Calcular nova posição da cabeça em células (grade)
  direction = nextDirection;
  let head = { ...snake[0] };

  if (direction === "up") head.y -= 1;
  if (direction === "down") head.y += 1;
  if (direction === "left") head.x -= 1;
  if (direction === "right") head.x += 1;

  // Verificar colisão com paredes (baseado na grade)
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    endGame();
    return;
  }

  // Verificar colisão com o corpo
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  // Adicionar cabeça (cresce automaticamente quando não remover a cauda)
  snake.unshift(head);

  // Verificar se comeu a comida (coordenadas inteiras)
  if (head.x === food.x && head.y === food.y) {
    score++;

    // Aumentar nível a cada 5 pontos
    const newLevel = Math.floor(score / 5) + 1;
    if (newLevel !== level) {
      level = newLevel;
      gameSpeed = Math.max(50, 100 - (level - 1) * 10);
      clearInterval(gameInterval);
      gameInterval = setInterval(draw, gameSpeed);
    }

    generateFood();
    updateDisplay();
  } else {
    // não comeu: remove a cauda mantendo o tamanho
    snake.pop();
  }

  // Desenhar cobra (usando posição em células convertida para pixels)
  drawSnake();
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const isHead = i === 0;
    const segment = snake[i];
    const px = segment.x * box;
    const py = segment.y * box;

    if (isHead) {
      // Cabeça com gradiente
      ctx.fillStyle = "#0f0";
      ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillRect(px + 1, py + 1, box - 2, box - 2);
      ctx.shadowColor = "transparent";

      // Olhos
      ctx.fillStyle = "#000";
      ctx.fillRect(px + box * 0.2, py + box * 0.2, Math.max(2, box * 0.08), Math.max(2, box * 0.08));
      ctx.fillRect(px + box * 0.7, py + box * 0.2, Math.max(2, box * 0.08), Math.max(2, box * 0.08));
    } else {
      // Corpo com degradação de cor
      const intensity = Math.max(80, 200 - (i * 10));
      ctx.fillStyle = `rgb(0, ${intensity}, 0)`;
      ctx.fillRect(px + 1, py + 1, box - 2, box - 2);
    }

    // Borda
    ctx.strokeStyle = "#0a0";
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

  // Brilho na comida
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
// Prevenir scroll em toque
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
});

// Inicializar
initGame();
draw();

// Carregar nome do jogador ao iniciar
confirmNameBtn.addEventListener("click", confirmPlayerName);
playerNameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") confirmPlayerName();
});

loadPlayerName();
