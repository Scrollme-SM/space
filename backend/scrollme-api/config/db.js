const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Connecting to MongoDB:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB Connected Successfully!');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
