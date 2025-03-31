// 🚀 ScrollMe SpaceRunner - Enhanced Version

// Initialize User const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:"); localStorage.setItem("userId", userId);

// Canvas Setup const canvas = document.getElementById("gameCanvas"); const ctx = canvas.getContext("2d");

const bullets = [], enemies = [], powerUps = [], explosions = []; let coinsEarned = 0, dailyScore = 0, highScore = 0, gameOver = false;

// Load Assets const assets = { spaceship: "./assets/spaceship.png", enemy: "./assets/enemy.png", bullet: "./assets/bullet.png", explosion: "./assets/explosion.png", shield: "./assets/shield.png", doubleBullets: "./assets/double-bullets.png", speedBoost: "./assets/speed-boost.png", background1: "./assets/background1.jpg", background2: "./assets/background2.jpg", gameMusic: "./assets/game-music.mp3", explosionSound: "./assets/explosion.mp3", powerUpSound: "./assets/powerup.mp3" };

const images = {}; Object.keys(assets).forEach(key => { if (!assets[key].endsWith(".mp3")) { images[key] = new Image(); images[key].src = assets[key]; } });

const sounds = { gameMusic: new Audio(assets.gameMusic), explosion: new Audio(assets.explosionSound), powerUp: new Audio(assets.powerUpSound) };

// Start Background Music canvas.addEventListener("click", () => { sounds.gameMusic.loop = true; sounds.gameMusic.play().catch(() => console.log("Autoplay blocked.")); });

// Fetch Scores async function fetchScores() { try { const response = await fetch(https://your-server-url.com/get-scores?userId=${userId}); const data = await response.json(); highScore = data.highScore || 0; dailyScore = data.dailyScore || 0; } catch (error) { console.error("Error fetching scores:", error); } }

// Background Scrolling const backgrounds = [ { img: images.background1, y: 0 }, { img: images.background2, y: -canvas.height * 4 } ];

function updateBackground() { backgrounds.forEach(bg => { bg.y += 0.5; if (bg.y >= canvas.height * 4) { bg.y = -canvas.height * 4; } }); }

// Spaceship const spaceship = { x: 150, y: 475, width: 50, height: 50, speed: 8, shield: false, doubleBullets: false, speedBoost: false };

// Shooting Mechanism function shoot() { if (spaceship.doubleBullets) { bullets.push({ x: spaceship.x + 5, y: spaceship.y, width: 10, height: 20 }); bullets.push({ x: spaceship.x + 35, y: spaceship.y, width: 10, height: 20 }); } else { bullets.push({ x: spaceship.x + 20, y: spaceship.y, width: 10, height: 20 }); } }

// Controls let moveLeft = false, moveRight = false;

canvas.addEventListener("touchstart", e => handleInput(e, true)); canvas.addEventListener("touchend", e => handleInput(e, false)); canvas.addEventListener("mousedown", () => moveLeft = true); canvas.addEventListener("mouseup", () => moveLeft = false);

document.addEventListener("keydown", e => { if (e.key === "ArrowLeft") moveLeft = true; if (e.key === "ArrowRight") moveRight = true; }); document.addEventListener("keyup", e => { if (e.key === "ArrowLeft") moveLeft = false; if (e.key === "ArrowRight") moveRight = false; });

function handleInput(e, state) { const x = e.touches[0]?.clientX || e.clientX; moveLeft = state && x < canvas.width / 2; moveRight = state && x >= canvas.width / 2; }

// Enemies setInterval(() => { enemies.push({ x: Math.random() * (canvas.width - 40), y: 0, width: 40, height: 40, speed: Math.random() * 2 + 1 }); }, 2000);

function updateEnemies() { enemies.forEach((enemy, index) => { enemy.y += enemy.speed; if (enemy.y >= canvas.height) enemies.splice(index, 1); }); }

// Power-Ups function spawnPowerUp() { const types = ["shield", "doubleBullets", "speedBoost"]; const type = types[Math.floor(Math.random() * types.length)]; powerUps.push({ x: Math.random() * (canvas.width - 30), y: 0, width: 30, height: 30, type, speed: 2 }); } setInterval(spawnPowerUp, 10000);

// Collision Detection function isCollision(obj1, obj2) { return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y; }

// Game Loop function update() { if (gameOver) return; ctx.clearRect(0, 0, canvas.width, canvas.height); updateBackground(); backgrounds.forEach(bg => ctx.drawImage(bg.img, 0, bg.y, canvas.width, canvas.height * 4));

// Update Elements
updateEnemies();
moveLeft && (spaceship.x = Math.max(0, spaceship.x - spaceship.speed));
moveRight && (spaceship.x = Math.min(canvas.width - spaceship.width, spaceship.x + spaceship.speed));

bullets.forEach((bullet, i) => {
    bullet.y -= 5;
    enemies.forEach((enemy, j) => {
        if (isCollision(bullet, enemy)) {
            sounds.explosion.play();
            explosions.push({ x: enemy.x, y: enemy.y, timer: 10 });
            enemies.splice(j, 1);
            bullets.splice(i, 1);
            coinsEarned += 10;
            dailyScore = Math.min(dailyScore + 10, 100);
        }
    });
});

powerUps.forEach((p, k) => {
    if (isCollision(p, spaceship)) {
        sounds.powerUp.play();
        spaceship[p.type] = true;
        setTimeout(() => spaceship[p.type] = false, 10000);
        powerUps.splice(k, 1);
    }
});

requestAnimationFrame(update);

}

// Start Game fetchScores(); update();

