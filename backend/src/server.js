process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 16;

const app = require('./app');

// Temporarily disable PDF worker (needs Redis)
 // require('./workers/pdf.worker');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Redis is disabled for development`);
});