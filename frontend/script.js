const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:");
localStorage.setItem("userId", userId);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bullets = [];
const enemies = [];
const explosions = [];
let coinsEarned = 0;
let dailyScore = 0;
let highScore = 0;
let gameOver = false;

// 📌 Load Images
const spaceshipImg = new Image();
spaceshipImg.src = "./assets/spaceship.png";

const enemyImg = new Image();
enemyImg.src = "./assets/enemy.png";

const bulletImg = new Image();
bulletImg.src = "./assets/bullet.png";

const backgroundImg = new Image();
backgroundImg.src = "./assets/background.jpg";

const explosionImg = new Image();
explosionImg.src = "./assets/explosion.png";

// 📌 Load Sounds
const gameMusic = new Audio("./assets/game-music.mp3");
const explosionSound = new Audio("./assets/explosion.mp3");

// 📌 Start Background Music (On First Click)
document.addEventListener("click", () => {
    gameMusic.loop = true;
    gameMusic.play().catch(() => console.log("Autoplay blocked."));
});

// 📌 Fetch Scores from Backend
async function fetchScores() {
    try {
        const response = await fetch(`https://your-server-url.com/get-scores?userId=${userId}`);
        const data = await response.json();
        highScore = data.highScore || 0;
        dailyScore = data.dailyScore || 0;
    } catch (error) {
        console.error("Error fetching scores:", error);
    }
}

// 📌 Draw Scores Inside Canvas
function drawScores() {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`🏆 High Score: ${highScore}`, 10, 30);
    ctx.fillText(`🎯 Daily Score: ${dailyScore}/100`, 10, 50);
    ctx.fillText(`💰 Current Score: ${coinsEarned}`, 10, 70);
}

// 📌 Spaceship Data
const spaceship = { x: 175, y: 500, width: 50, height: 50, speed: 6 };

// 📌 Update Coins
function updateCoins(coins) {
    let coinsToAdd = Math.min(coins, 100 - dailyScore);
    if (coinsToAdd > 0) dailyScore += coinsToAdd;
    
    coinsEarned += coins;
    if (coinsEarned > highScore) highScore = coinsEarned;

    fetch("https://your-server-url.com/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, score: coinsToAdd })
    }).catch((err) => console.log("Error updating score:", err));
}

// 📌 Draw Functions
function drawSpaceship() {
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function drawBullets() {
    bullets.forEach((bullet) => {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 20);
    });
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, 40, 40);
    });
}

// 📌 Draw Explosions
function drawExplosions() {
    explosions.forEach((explosion, index) => {
        ctx.drawImage(explosionImg, explosion.x, explosion.y, 50, 50);
        setTimeout(() => {
            explosions.splice(index, 1);
        }, 200);
    });
}

// 📌 Game Update Loop
let bgY = 0;
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 📌 Background Animation
    bgY += 2;
    if (bgY >= canvas.height) bgY = 0;
    ctx.drawImage(backgroundImg, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, bgY - canvas.height, canvas.width, canvas.height);

    drawScores();
    drawSpaceship();
    drawEnemies();
    drawBullets();
    drawExplosions();

    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    enemies.forEach((enemy, index) => {
        enemy.y += 2;
        if (enemy.y > canvas.height) enemies.splice(index, 1);

        // 📌 Check for Game Over (Enemy Collides with Player)
        if (
            enemy.x < spaceship.x + spaceship.width &&
            enemy.x + 40 > spaceship.x &&
            enemy.y < spaceship.y + spaceship.height &&
            enemy.y + 40 > spaceship.y
        ) {
            gameOver = true;
            alert("Game Over! Restarting...");
            setTimeout(() => location.reload(), 2000);
        }
    });

    // 📌 Collision Detection
    enemies.forEach((enemy, eIndex) => {
        bullets.forEach((bullet, bIndex) => {
            if (Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20) {
                bullets.splice(bIndex, 1);
                explosionSound.play();
                
                explosions.push({ x: enemy.x, y: enemy.y });
                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                }, 100);

                updateCoins(5);
            }
        });
    });

    requestAnimationFrame(update);
}

// 📌 Smooth Movement
let moveLeft = false;
let moveRight = false;

document.getElementById("leftBtn").addEventListener("mousedown", () => moveLeft = true);
document.getElementById("leftBtn").addEventListener("mouseup", () => moveLeft = false);
document.getElementById("rightBtn").addEventListener("mousedown", () => moveRight = true);
document.getElementById("rightBtn").addEventListener("mouseup", () => moveRight = false);

function movePlayer() {
    if (moveLeft) spaceship.x = Math.max(0, spaceship.x - spaceship.speed);
    if (moveRight) spaceship.x = Math.min(canvas.width - spaceship.width, spaceship.x + spaceship.speed);
    requestAnimationFrame(movePlayer);
}

movePlayer();

// 📌 Shoot Bullets
document.getElementById("shootBtn").addEventListener("click", () => {
    bullets.push({ x: spaceship.x + 22, y: spaceship.y });
});

// 📌 Spawn Enemies
setInterval(() => {
    enemies.push({ x: Math.random() * (canvas.width - 40), y: 0 });
}, 2000);

update();
fetchScores();