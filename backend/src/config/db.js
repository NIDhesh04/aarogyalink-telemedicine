const mongoose = require('mongoose');

// Rename to connectDB to match your server.js
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);    
    }
};

// Export as an object so { connectDB } works in server.js
module.exports = { connectDB };