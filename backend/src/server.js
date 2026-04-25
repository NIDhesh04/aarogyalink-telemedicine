// Tune UV_THREADPOOL_SIZE for performance (default is 4, increasing to 16 for heavy I/O/worker load)
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 16;

const app = require('./app');

require('./workers/pdf.worker'); // Start the PDF worker

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

