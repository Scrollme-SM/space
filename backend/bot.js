require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// 📌 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// 📌 Define User Schema
const UserSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coins: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    referredBy: { type: String, default: null }
});
const User = mongoose.model('User', UserSchema);

// 📌 Handle /start Command
bot.start(async (ctx) => {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name || 'Anonymous';
    const referralId = ctx.startPayload;

    let user = await User.findOne({ userId });
    if (!user) {
        user = await User.create({ userId, username });
    }

    if (referralId && referralId !== userId) {
        const referrer = await User.findOne({ userId: referralId });
        if (referrer && !user.referredBy) {
            user.referredBy = referralId;
            user.coins += 50;  // Bonus for new user
            referrer.referrals += 1;
            referrer.coins += 100;  // Bonus for referrer
            await user.save();
            await referrer.save();
            bot.telegram.sendMessage(referralId, `🎉 You referred ${username} and earned 100 coins!`);
        }
    }

    ctx.reply(`Welcome to Space Runner 🚀! Play: https://space-runner.netlify.app \n\nInvite friends and earn 100 coins per referral!`);
});

// 📌 Monthly Leaderboard Reset (On the 1st of Every Month)
cron.schedule('0 0 1 * *', async () => {
    const leaderboard = await User.find({ referrals: { $gte: 5 } })
        .sort({ coins: -1, referrals: -1, joinDate: 1 })
        .limit(100);

    let leaderboardMessage = "🏆 **Monthly Leaderboard (Top 100 Players)** 🏆\n\n";
    leaderboard.forEach((player, index) => {
        leaderboardMessage += `${index + 1}. @${player.username || 'Anonymous'} - ${player.coins} coins, ${player.referrals} referrals\n`;
    });

    bot.telegram.sendMessage(process.env.TELEGRAM_GROUP_ID, leaderboardMessage);
    await User.updateMany({}, { coins: 0, coinsToday: 0 });
});

// 📌 Handle /convert Command (Token Conversion)
bot.command("convert", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || "Unknown";
    
    try {
        const user = await axios.get(`https://your-server-url.com/get-scores?userId=${userId}`);
        if (user.data.coins < 100) {
            return ctx.reply("❌ You need at least 100 coins to convert!");
        }

        ctx.reply("💰 How many coins do you want to convert? Reply with a number.");
        
        bot.hears(/^\d+$/, async (ctx) => {
            const coinsRequested = parseInt(ctx.message.text);
            if (coinsRequested < 100) {
                return ctx.reply("❌ Minimum conversion amount is 100 coins.");
            }

            const response = await axios.post("https://your-server-url.com/request-token-conversion", {
                userId,
                username,
                coinsRequested
            });

            ctx.reply(response.data.message);
        });
    } catch (error) {
        ctx.reply("❌ Error processing your request. Please try again later.");
    }
});

// 📌 Start Bot (Move to End)
bot.launch();