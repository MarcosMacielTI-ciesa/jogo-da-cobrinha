// script.js
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const box = 20;
let snake = [{ x: 200, y: 200 }];
let direction = "right";
let food = {
  x: Math.floor(Math.random() * 20) * box,
  y: Math.floor(Math.random() * 20) * box
};

document.addEventListener("keydown", event => {
  if (event.key === "ArrowUp" && direction !== "down") direction = "up";
  if (event.key === "ArrowDown" && direction !== "up") direction = "down";
  if (event.key === "ArrowLeft" && direction !== "right") direction = "left";
  if (event.key === "ArrowRight" && direction !== "left") direction = "right";
});

function draw() {
  ctx.clearRect(0, 0, 400, 400);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "lime" : "green";
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  let head = { ...snake[0] };
  if (direction === "up") head.y -= box;
  if (direction === "down") head.y += box;
  if (direction === "left") head.x -= box;
  if (direction === "right") head.x += box;

  // Game over
  if (
    head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400 ||
    snake.some(segment => segment.x === head.x && segment.y === head.y)
  ) {
    clearInterval(game);
    alert("Game Over!");
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    food = {
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box
    };
  } else {
    snake.pop();
  }
}

let game = setInterval(draw, 100);
