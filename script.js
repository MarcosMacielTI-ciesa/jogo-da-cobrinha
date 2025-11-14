// script.js
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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
let box;
let gridSize;
let snake = [];
let direction = "right";
let nextDirection = "right";
let food = {};
let score = 0;
let level = 1;
let gameSpeed = 100;
let gamePaused = false;
let gameRunning = false;
let gameOver = false;
let gameInterval;

// Elementos da UI
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Inicializar jogo
function initGame() {
  gridSize = Math.floor(canvas.width / 20);
  box = canvas.width / gridSize;
  snake = [{ x: Math.floor(gridSize / 2) * box, y: Math.floor(gridSize / 2) * box }];
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
  food = {
    x: Math.floor(Math.random() * gridSize) * box,
    y: Math.floor(Math.random() * gridSize) * box
  };
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
}

function startGame() {
  if (!gameRunning) {
    gameRunning = true;
    gameOver = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    gameInterval = setInterval(draw, gameSpeed);
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
  startBtn.textContent = "▶ Recomeçar";
  
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
  for (let i = 0; i <= gridSize; i++) {
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

  // Desenhar comida com efeito
  drawFood();

  // Calcular nova posição da cabeça
  direction = nextDirection;
  let head = { ...snake[0] };
  
  if (direction === "up") head.y -= box;
  if (direction === "down") head.y += box;
  if (direction === "left") head.x -= box;
  if (direction === "right") head.x += box;

  // Verificar colisão com paredes
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    endGame();
    return;
  }

  // Verificar colisão com o corpo
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }

  // Adicionar cabeça
  snake.unshift(head);

  // Verificar se comeu a comida
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
    snake.pop();
  }

  // Desenhar cobra
  drawSnake();
}

function drawSnake() {
  for (let i = 0; i < snake.length; i++) {
    const isHead = i === 0;
    const segment = snake[i];

    if (isHead) {
      // Cabeça com gradiente
      ctx.fillStyle = "#0f0";
      ctx.shadowColor = "rgba(0, 255, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillRect(segment.x + 1, segment.y + 1, box - 2, box - 2);
      ctx.shadowColor = "transparent";
      
      // Olhos
      ctx.fillStyle = "#000";
      ctx.fillRect(segment.x + 5, segment.y + 5, 3, 3);
      ctx.fillRect(segment.x + box - 8, segment.y + 5, 3, 3);
    } else {
      // Corpo com degradação de cor
      const intensity = Math.max(100, 200 - (i * 10));
      ctx.fillStyle = `rgb(0, ${intensity}, 0)`;
      ctx.fillRect(segment.x + 1, segment.y + 1, box - 2, box - 2);
    }

    // Borda
    ctx.strokeStyle = "#0a0";
    ctx.lineWidth = 1;
    ctx.strokeRect(segment.x + 1, segment.y + 1, box - 2, box - 2);
  }
}

function drawFood() {
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "rgba(255, 68, 68, 0.8)";
  ctx.shadowBlur = 10;
  const padding = box * 0.1;
  ctx.fillRect(food.x + padding, food.y + padding, box - padding * 2, box - padding * 2);
  ctx.shadowColor = "transparent";
  
  // Brilho na comida
  ctx.strokeStyle = "#ff7777";
  ctx.lineWidth = 2;
  ctx.strokeRect(food.x + padding, food.y + padding, box - padding * 2, box - padding * 2);
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
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
restartBtn.addEventListener("click", restartGame);

// Controles de toque para mobile
upBtn.addEventListener("click", () => {
  if (gameRunning && !gamePaused && direction !== "down") nextDirection = "up";
});

downBtn.addEventListener("click", () => {
  if (gameRunning && !gamePaused && direction !== "up") nextDirection = "down";
});

leftBtn.addEventListener("click", () => {
  if (gameRunning && !gamePaused && direction !== "right") nextDirection = "left";
});

rightBtn.addEventListener("click", () => {
  if (gameRunning && !gamePaused && direction !== "left") nextDirection = "right";
});

// Prevenir scroll em toque
upBtn.addEventListener("touchstart", e => e.preventDefault());
downBtn.addEventListener("touchstart", e => e.preventDefault());
leftBtn.addEventListener("touchstart", e => e.preventDefault());
rightBtn.addEventListener("touchstart", e => e.preventDefault());

// Inicializar
initGame();
draw();
