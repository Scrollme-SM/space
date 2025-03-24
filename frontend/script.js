const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:");
localStorage.setItem("userId", userId);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bullets = [];
const enemies = [];
let coinsEarned = 0;

// 📌 Load Images
const spaceshipImg = new Image();
spaceshipImg.src = "assets/spaceship.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const bulletImg = new Image();
bulletImg.src = "assets/bullet.png";

const backgroundImg = new Image();
backgroundImg.src = "assets/background.jpg";

// 📌 Load Sounds
const gameMusic = new Audio("assets/game-music.mp3");
const explosionSound = new Audio("assets/explosion.mp3");

gameMusic.loop = true;
gameMusic.play(); // Start background music

// 📌 Spaceship Data
const spaceship = { x: 175, y: 500, width: 50, height: 50, speed: 10 };

// 📌 Function to Send Coins to Bot
function updateCoins(coins) {
    fetch("https://your-bot-render-url.com/update-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, coins })
    }).then(res => res.json()).then(data => {
        if (data.success) coinsEarned += data.coinsAdded;
    });
}

// 📌 Function to Get Leaderboard
function fetchLeaderboard() {
    fetch("https://your-bot-render-url.com/leaderboard")
        .then(res => res.json())
        .then(players => {
            let leaderboardText = "";
            players.forEach((player, index) => {
                leaderboardText += `${index + 1}. ${player.username} - ${player.coins} coins\n`;
            });
            document.getElementById("leaderboardContent").innerText = leaderboardText;
        });
}

// 📌 Draw Functions
function drawSpaceship() {
    ctx.drawImage(spaceshipImg, spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 20);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, 40, 40);
    });
}

// 📌 Game Logic (Rendering)
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    drawSpaceship();
    drawEnemies();
    drawBullets();

    // Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Move enemies
    enemies.forEach((enemy, index) => {
        enemy.y += 2;
        if (enemy.y > canvas.height) enemies.splice(index, 1);
    });

    // Bullet Collision with Enemies
    enemies.forEach((enemy, eIndex) => {
        bullets.forEach((bullet, bIndex) => {
            if (Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                explosionSound.play(); // Play explosion sound
                updateCoins(5); // Earn 5 coins per enemy
            }
        });
    });

    requestAnimationFrame(update);
}

// 📌 Player Controls
document.getElementById('leftBtn').addEventListener('click', () => {
    spaceship.x = Math.max(0, spaceship.x - spaceship.speed);
});
document.getElementById('rightBtn').addEventListener('click', () => {
    spaceship.x = Math.min(canvas.width - spaceship.width, spaceship.x + spaceship.speed);
});
document.getElementById('shootBtn').addEventListener('click', () => {
    bullets.push({ x: spaceship.x + 22, y: spaceship.y });
});

// 📌 Spawn Enemies Every 2 Seconds
setInterval(() => {
    enemies.push({ x: Math.random() * (canvas.width - 40), y: 0 });
}, 2000);

update();
fetchLeaderboard();