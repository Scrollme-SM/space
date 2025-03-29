// 🚀 Initialize User
const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:");
localStorage.setItem("userId", userId);

// 🚀 Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bullets = [];
const enemies = [];
const powerUps = [];
const explosions = []; // Array to store explosion animations
let coinsEarned = 0, dailyScore = 0, highScore = 0, gameOver = false;

// 🚀 Load Images
const spaceshipImg = new Image(); spaceshipImg.src = "./assets/spaceship.png";
const enemyImg = new Image(); enemyImg.src = "./assets/enemy.png";
const bulletImg = new Image(); bulletImg.src = "./assets/bullet.png";
const explosionImg = new Image(); explosionImg.src = "./assets/explosion.png";
const shieldImg = new Image(); shieldImg.src = "./assets/shield.png";
const doubleBulletsImg = new Image(); doubleBulletsImg.src = "./assets/double-bullets.png";
const speedBoostImg = new Image(); speedBoostImg.src = "./assets/speed-boost.png";

// 🎵 Load Sounds
const gameMusic = new Audio("./assets/game-music.mp3");
const explosionSound = new Audio("./assets/explosion.mp3");
const powerUpSound = new Audio("./assets/powerup.mp3");

// 📌 Start Background Music
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

// 🚀 Parallax Background
const backgrounds = [
    { img: new Image(), y: 0 },
    { img: new Image(), y: -canvas.height },
    { img: new Image(), y: -canvas.height * 2 }
];
backgrounds[0].img.src = "./assets/background1.jpg";
backgrounds[1].img.src = "./assets/background2.jpg";
backgrounds[2].img.src = "./assets/background3.jpg";

function updateBackground() {
    backgrounds.forEach(bg => {
        bg.y += 1;
        if (bg.y >= canvas.height) bg.y = -canvas.height * 2;
    });
}

function drawBackground() {
    backgrounds.forEach(bg => ctx.drawImage(bg.img, 0, bg.y, canvas.width, canvas.height));
}

// 🚀 Spaceship
const spaceship = { 
    x: 175, 
    y: 500, 
    width: 50, 
    height: 50, 
    speed: 8,
    shield: false, 
    doubleBullets: false,
    speedBoost: false 
};

// 🚀 Shooting Mechanism (Automatic)
function shoot() {
    if (spaceship.doubleBullets) {
        bullets.push({ x: spaceship.x + 5, y: spaceship.y, width: 10, height: 20 });
        bullets.push({ x: spaceship.x + 35, y: spaceship.y, width: 10, height: 20 });
    } else {
        bullets.push({ x: spaceship.x + 20, y: spaceship.y, width: 10, height: 20 });
    }
}

// 🚀 Control Buttons Inside Canvas
const leftButton = { x: 10, y: 510, width: 80, height: 80 }; // Moved to extreme left
const rightButton = { x: 310, y: 510, width: 80, height: 80 }; // Moved to extreme right

let moveLeft = false, moveRight = false;

function drawControls() {
    // Left Arrow Button
    ctx.fillStyle = moveLeft ? "#00e5ff" : "#0ff";
    ctx.beginPath();
    ctx.arc(leftButton.x + leftButton.width / 2, leftButton.y + leftButton.height / 2, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("←", leftButton.x + 25, leftButton.y + 55);

    // Right Arrow Button
    ctx.fillStyle = moveRight ? "#00e5ff" : "#0ff";
    ctx.beginPath();
    ctx.arc(rightButton.x + rightButton.width / 2, rightButton.y + rightButton.height / 2, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("→", rightButton.x + 25, rightButton.y + 55);
}

// 🚀 Touch and Mouse Controls
canvas.addEventListener("mousedown", handleInputStart);
canvas.addEventListener("touchstart", handleInputStart);
canvas.addEventListener("mousemove", handleInputMove);
canvas.addEventListener("touchmove", handleInputMove);
canvas.addEventListener("mouseup", handleInputEnd);
canvas.addEventListener("touchend", handleInputEnd);

function handleInputStart(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    if (isPointInCircle(x, y, leftButton)) moveLeft = true;
    if (isPointInCircle(x, y, rightButton)) moveRight = true;
}

function handleInputMove(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    moveLeft = isPointInCircle(x, y, leftButton);
    moveRight = isPointInCircle(x, y, rightButton);
}

function handleInputEnd() {
    moveLeft = false;
    moveRight = false;
}

function isPointInCircle(x, y, button) {
    const centerX = button.x + button.width / 2;
    const centerY = button.y + button.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance <= 40;
}

// 🚀 Keyboard Controls (Optional)
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") moveLeft = true;
    if (event.key === "ArrowRight") moveRight = true;
});

document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") moveLeft = false;
    if (event.key === "ArrowRight") moveRight = false;
});

// 🚀 Enemy AI - Move Down
function updateEnemies() {
    enemies.forEach(enemy => {
        enemy.y += enemy.speed;
        if (enemy.y >= canvas.height) enemy.y = -40;
    });
}

// 🚀 Power-Ups Spawn
function spawnPowerUp() {
    const types = ["shield", "doubleBullets", "speedBoost"];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push({ 
        x: Math.random() * (canvas.width - 30), 
        y: 0, 
        width: 30, 
        height: 30, 
        type, 
        speed: 2 
    });
}

setInterval(spawnPowerUp, 10000);

// 🚀 Draw Functions
function drawScores() {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(`🏆 High Score: ${highScore}`, 10, 30);
    ctx.fillText(`🎯 Daily Score: ${dailyScore}/100`, 10, 50);
    ctx.fillText(`💰 Current Score: ${coinsEarned}`, 10, 70);
}

function drawSpaceship() {
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
    if (spaceship.shield) ctx.drawImage(shieldImg, spaceship.x - 5, spaceship.y - 5, 60, 60);
}

function drawBullets() {
    bullets.forEach(bullet => {
        bullet.y -= 5;
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 20);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => ctx.drawImage(enemyImg, enemy.x, enemy.y, 40, 40));
}

function drawPowerUps() {
    powerUps.forEach(p => {
        if (p.type === "shield") ctx.drawImage(shieldImg, p.x, p.y, 30, 30);
        else if (p.type === "doubleBullets") ctx.drawImage(doubleBulletsImg, p.x, p.y, 30, 30);
        else if (p.type === "speedBoost") ctx.drawImage(speedBoostImg, p.x, p.y, 30, 30);
        p.y += p.speed;
    });
}

function drawExplosions() {
    explosions.forEach((exp, index) => {
        ctx.drawImage(explosionImg, exp.x, exp.y, 40, 40);
        exp.timer--;
        if (exp.timer <= 0) explosions.splice(index, 1);
    });
}

// 🚀 Collision Detection
function isCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 🚀 Game Update Loop
let shootTimer = 0;
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateBackground();
    drawBackground();

    drawScores();
    drawSpaceship();
    drawEnemies();
    drawBullets();
    drawPowerUps();
    drawControls();
    drawExplosions();

    // Automatic Shooting
    shootTimer++;
    if (shootTimer >= 20) { // Shoot every 20 frames (~0.33 seconds at 60 FPS)
        shoot();
        shootTimer = 0;
    }

    // Update Spaceship Movement
    if (moveLeft) spaceship.x = Math.max(0, spaceship.x - spaceship.speed);
    if (moveRight) spaceship.x = Math.min(canvas.width - spaceship.width, spaceship.x + spaceship.speed);

    // Update Bullets
    bullets.forEach((bullet, index) => {
        if (bullet.y < 0) bullets.splice(index, 1);
        enemies.forEach((enemy, eIndex) => {
            if (isCollision(bullet, enemy)) {
                explosionSound.play();
                explosions.push({ x: enemy.x, y: enemy.y, timer: 10 }); // Explosion lasts 10 frames
                enemies.splice(eIndex, 1);
                bullets.splice(index, 1);
                coinsEarned += 10;
                dailyScore = Math.min(dailyScore + 10, 100);
            }
        });
    });

    // Update Enemies
    updateEnemies();
    enemies.forEach((enemy, eIndex) => {
        if (isCollision(enemy, spaceship)) {
            if (spaceship.shield) {
                spaceship.shield = false;
                enemies.splice(eIndex, 1);
            } else {
                gameOver = true;
                alert("Game Over! Restarting...");
                setTimeout(resetGame, 2000);
            }
        }
    });

    // Update Power-Ups
    powerUps.forEach((p, pIndex) => {
        if (isCollision(p, spaceship)) {
            powerUpSound.play();
            if (p.type === "shield") spaceship.shield = true;
            else if (p.type === "doubleBullets") {
                spaceship.doubleBullets = true;
                setTimeout(() => spaceship.doubleBullets = false, 10000);
            } else if (p.type === "speedBoost") {
                spaceship.speedBoost = true;
                spaceship.speed = 12;
                setTimeout(() => {
                    spaceship.speedBoost = false;
                    spaceship.speed = 8;
                }, 10000);
            }
            powerUps.splice(pIndex, 1);
        }
        if (p.y > canvas.height) powerUps.splice(pIndex, 1);
    });

    requestAnimationFrame(update);
}

// 🚀 Reset Game
function resetGame() {
    gameOver = false;
    enemies.length = 0;
    bullets.length = 0;
    powerUps.length = 0;
    explosions.length = 0;
    coinsEarned = 0;
    spaceship.x = 175;
    spaceship.shield = false;
    spaceship.doubleBullets = false;
    spaceship.speedBoost = false;
    spaceship.speed = 8;
    shootTimer = 0;
    update();
}

// 🚀 Spawn Enemies
setInterval(() => {
    enemies.push({ 
        x: Math.random() * (canvas.width - 40), 
        y: 0, 
        width: 40, 
        height: 40, 
        speed: Math.random() * 2 + 1 
    });
}, 2000);

// 🚀 Start Game
update();
fetchScores();