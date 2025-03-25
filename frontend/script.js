const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:");
localStorage.setItem("userId", userId);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const bullets = [];
const enemies = [];
let coinsEarned = 0;
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

// 📌 Load Sounds
const gameMusic = new Audio("./assets/game-music.mp3");
const explosionSound = new Audio("./assets/explosion.mp3");

// 📌 Start Background Music (On First Click)
document.addEventListener("click", () => {
    gameMusic.loop = true;
    gameMusic.play().catch((error) => console.log("Autoplay blocked, user interaction needed."));
});

// 📌 Spaceship Data
const spaceship = { x: 175, y: 500, width: 50, height: 50, speed: 6 };

// 📌 Update Coins
function updateCoins(coins) {
    coinsEarned += coins;  // Increase local coin count
    document.getElementById("coinCount").innerText = coinsEarned; // Update UI

    // Send coin update to the bot
    fetch("https://your-bot-render-url.com/update-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, coins })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Coins updated on server");
        }
    })
    .catch(err => console.log("Error updating coins:", err));
}

// 📌 Get Leaderboard
function fetchLeaderboard() {
    fetch("https://your-bot-render-url.com/leaderboard")
        .then((res) => res.json())
        .then((players) => {
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
    bullets.forEach((bullet) => {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 20);
    });
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, 40, 40);
    });
}

// 📌 Game Logic
function update() {
    if (gameOver) return; // Stop updating if game over

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    drawSpaceship();
    drawEnemies();
    drawBullets();

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
            setTimeout(() => location.reload(), 2000); // Restart after 2 seconds
        }
    });

    // 📌 Collision Detection (Destroy Enemies)
    enemies.forEach((enemy, eIndex) => {
        bullets.forEach((bullet, bIndex) => {
            if (Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                explosionSound.play();
                updateCoins(5);  // 📌 Increase coins when enemy is destroyed
            }
        });
    });

    requestAnimationFrame(update);
}

// 📌 Player Controls (Smoother Movement)
let moveLeft = false;
let moveRight = false;

document.getElementById("leftBtn").addEventListener("mousedown", () => (moveLeft = true));
document.getElementById("leftBtn").addEventListener("mouseup", () => (moveLeft = false));
document.getElementById("rightBtn").addEventListener("mousedown", () => (moveRight = true));
document.getElementById("rightBtn").addEventListener("mouseup", () => (moveRight = false));

document.getElementById("leftBtn").addEventListener("touchstart", () => (moveLeft = true));
document.getElementById("leftBtn").addEventListener("touchend", () => (moveLeft = false));
document.getElementById("rightBtn").addEventListener("touchstart", () => (moveRight = true));
document.getElementById("rightBtn").addEventListener("touchend", () => (moveRight = false));

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
fetchLeaderboard();