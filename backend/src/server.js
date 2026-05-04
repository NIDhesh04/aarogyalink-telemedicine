// 1. Set Threadpool size before anything else (Teammate 3 task)
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 16;

const app = require('./app');
const { connectDB } = require('./config/db');       // Added this
const { connectRedis } = require('./config/redis'); // Added this

// Import workers to handle background PDF tasks
require('./workers/pdf.worker'); 

const PORT = process.env.PORT || 5000;

// 2. The "Master Startup" Function
const startServer = async () => {
    try {
        // Connect to MongoDB first[cite: 1]
        await connectDB();
        console.log('✅ Database connected');

        // Connect to Redis (Fixes your "Client is closed" error)[cite: 1]
        await connectRedis(); 
        
        app.listen(PORT, () => {
            console.log(`🚀 AarogyaLink Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Critical Startup Failure:', error.message);
        process.exit(1); // Stop if we can't connect to our infrastructure[cite: 1]
    }
};

startServer();