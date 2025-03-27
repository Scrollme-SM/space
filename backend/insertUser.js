require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://admin:Tech0hub25@cluster0.y7nb5b3.mongodb.net/SpaceRunnerDB";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB Connection Failed:", err));

const UserSchema = new mongoose.Schema({
    userId: String,
    username: String,
    coins: Number,
    highScore: Number,
    dailyScore: Number,
    referrals: Number,
    joinDate: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

async function addUser() {
    try {
        const newUser = new User({
            userId: "100001",
            username: "TestUser",
            coins: 50,
            highScore: 200,
            dailyScore: 10,
            referrals: 2
        });

        await newUser.save();
        console.log("✅ User added successfully!");
    } catch (error) {
        console.error("❌ Failed to add user:", error);
    } finally {
        mongoose.connection.close();
    }
}

addUser();

