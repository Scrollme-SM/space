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

// 📌 Pixel-Based Collision Detection
function isPixelCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
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

    enemies.forEach((enemy, eIndex) => {
        enemy.y += 2;
        enemy.x += Math.sin(enemy.y * 0.05) * 2;  // ⬅️ Move enemy left-right in a curve

        if (enemy.y > canvas.height) enemies.splice(eIndex, 1);

        // 📌 Check for Game Over (Enemy Collides with Player)
        if (isPixelCollision(enemy, spaceship)) {
            gameOver = true;
            alert("Game Over! Restarting...");
            setTimeout(() => location.reload(), 2000);
        }
    });

    // 📌 FIXED: Bullet & Enemy Collision Detection (Enemies Now Destroy Properly)
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (isPixelCollision(enemies[i], bullets[j])) {
                bullets.splice(j, 1);  // Remove bullet
                explosions.push({ x: enemies[i].x, y: enemies[i].y });  // Show explosion
                enemies.splice(i, 1);  // Remove enemy
                explosionSound.play();
                updateCoins(5);
                break; // Ensure only one bullet destroys an enemy
            }
        }
    }

    requestAnimationFrame(update);
}

// 📌 Smooth Movement with Key Controls
let moveLeft = false;
let moveRight = false;

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveLeft = true;
    if (event.key === "ArrowRight") moveRight = true;
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") moveLeft = false;
    if (event.key === "ArrowRight") moveRight = false;
});

function movePlayer() {
    if (moveLeft) spaceship.x = Math.max(0, spaceship.x - spaceship.speed);
    if (moveRight) spaceship.x = Math.min(canvas.width - spaceship.width, spaceship.x + spaceship.speed);
    requestAnimationFrame(movePlayer);
}

movePlayer();

// 📌 **Fix for Left/Right Buttons Not Working**
document.getElementById("leftBtn").addEventListener("mousedown", () => moveLeft = true);
document.getElementById("leftBtn").addEventListener("mouseup", () => moveLeft = false);
document.getElementById("leftBtn").addEventListener("touchstart", () => moveLeft = true);
document.getElementById("leftBtn").addEventListener("touchend", () => moveLeft = false);

document.getElementById("rightBtn").addEventListener("mousedown", () => moveRight = true);
document.getElementById("rightBtn").addEventListener("mouseup", () => moveRight = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => moveRight = true);
document.getElementById("rightBtn").addEventListener("touchend", () => moveRight = false);

// 📌 Shoot Bullets
document.getElementById("shootBtn").addEventListener("click", () => {
    bullets.push({ x: spaceship.x + 22, y: spaceship.y, width: 10, height: 20 });
});

// 📌 Spawn Enemies (Every 2 Sec)
setInterval(() => {
    enemies.push({ x: Math.random() * (canvas.width - 40), y: 0, width: 40, height: 40 });
}, 2000);

update();
fetchScores();

document.getElementById("convertBtn").addEventListener("click", async () => {
    let coinsToConvert = prompt("Enter coins to convert (Min: 100)");
    coinsToConvert = parseInt(coinsToConvert);

    if (!coinsToConvert || coinsToConvert < 100) {
        alert("❌ You must enter at least 100 coins.");
        return;
    }

    try {
        const response = await fetch("https://your-server-url.com/request-token-conversion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, username: "Player", coinsRequested: coinsToConvert })
        });

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error("Error:", error);
        alert("❌ Conversion failed. Please try again.");
    }
});