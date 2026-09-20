require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start HTTP Server
const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 LabTrack Asset Management System`);
      console.log(`🌐 Server running in [${process.env.NODE_ENV || 'development'}] mode`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[Startup Error]:', err);
    process.exit(1);
  }
};

startServer();
