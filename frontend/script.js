const userId = localStorage.getItem("userId") || prompt("Enter Telegram ID:");
localStorage.setItem("userId", userId);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const bullets = [];
const enemies = [];
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

// 📌 Preload Explosion Image
const explosionImg = new Image();
explosionImg.src = "./assets/explosion.png";

// 📌 Load Sounds
const gameMusic = new Audio("./assets/game-music.mp3");
const explosionSound = new Audio("./assets/explosion.mp3");

// 📌 Start Background Music (On First Click)
document.addEventListener("click", () => {
    gameMusic.loop = true;
    gameMusic.play().catch((error) => console.log("Autoplay blocked, user interaction needed."));
});

// 📌 Fetch Scores from Backend
async function fetchScores() {
    try {
        const response = await fetch(`https://your-server-url.com/get-scores?userId=${userId}`);
        const data = await response.json();
        highScore = data.highScore || 0;
        dailyScore = data.dailyScore || 0;
        document.getElementById("highScore").innerText = highScore;
        document.getElementById("dailyScore").innerText = dailyScore;
    } catch (error) {
        console.error("Error fetching scores:", error);
    }
}

// 📌 Update Score UI
function updateScoreUI() {
    document.getElementById("currentScore").innerText = coinsEarned;
    document.getElementById("dailyScore").innerText = dailyScore;
}

// 📌 Spaceship Data
const spaceship = { x: 175, y: 500, width: 50, height: 50, speed: 6 };

// 📌 Update Coins with Correct Logic
function updateCoins(coins) {
    let coinsToAdd = Math.min(coins, 100 - dailyScore); // Limit dailyScore to 100
    if (coinsToAdd > 0) {
        dailyScore += coinsToAdd; // Update daily score (max 100)
    }

    coinsEarned += coins; // Keep current session score increasing (no limit)

    if (coinsEarned > highScore) {
        highScore = coinsEarned; // Update high score if it's a new record
    }

    // Update UI
    document.getElementById("currentScore").innerText = coinsEarned;
    document.getElementById("dailyScore").innerText = dailyScore;
    document.getElementById("highScore").innerText = highScore;

    // Send only dailyScore to backend (highScore & currentScore are local)
    fetch("https://your-server-url.com/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, score: coinsToAdd })  // Send only allowed daily score
    }).catch((err) => console.log("Error updating score:", err));
}

// 📌 Get Leaderboard
function fetchLeaderboard() {
    fetch("https://your-server-url.com/leaderboard")
        .then((res) => res.json())
        .then((players) => {
            let leaderboardText = "";
            players.forEach((player, index) => {
                leaderboardText += `${index + 1}. ${player.username} - ${player.dailyScore} coins\n`;
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

// 📌 Background Scroll Effect
let bgY = 0;

function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 📌 Move Background Downwards for Animation
    bgY += 2;
    if (bgY >= canvas.height) {
        bgY = 0;
    }
    ctx.drawImage(backgroundImg, 0, bgY, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, bgY - canvas.height, canvas.width, canvas.height);

    drawSpaceship();
    drawEnemies();
    drawBullets();

    // 📌 Move bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= 5;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // 📌 Move enemies
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

    // 📌 Collision Detection (Destroy Enemies)
    enemies.forEach((enemy, eIndex) => {
        bullets.forEach((bullet, bIndex) => {
            if (Math.abs(bullet.x - enemy.x) < 20 && Math.abs(bullet.y - enemy.y) < 20) {
                bullets.splice(bIndex, 1);
                explosionSound.play();

                // 📌 Explosion Animation
                ctx.drawImage(explosionImg, enemy.x, enemy.y, 50, 50);

                setTimeout(() => {
                    enemies.splice(eIndex, 1);
                }, 100); // Delay enemy removal for animation

                updateCoins(5);
            }
        });
    });

    requestAnimationFrame(update);
}

// 📌 Player Controls (Smoother Movement)
document.getElementById("convertBtn").addEventListener("click", () => {
    let coinsToConvert = prompt("Enter coins to convert (Min: 100)");
    coinsToConvert = parseInt(coinsToConvert);
    
    if (!coinsToConvert || coinsToConvert < 100) {
        alert("❌ You must enter at least 100 coins.");
        return;
    }

    fetch("https://your-server-url.com/request-token-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username: "Player", coinsRequested: coinsToConvert })
    })
    .then((res) => res.json())
    .then((data) => alert(data.message))
    .catch((err) => console.error("Error:", err));
});

// 📌 Button Click Animation
document.querySelectorAll(".control-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        btn.classList.add("active");
        setTimeout(() => btn.classList.remove("active"), 100);
    });
});

update();
fetchScores();
fetchLeaderboard();