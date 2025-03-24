require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const cron = require('node-cron');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
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

// 📌 Start Bot
bot.launch();