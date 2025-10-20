/**
 * Application Entry Point
 * Clean separation of concerns - only handles server initialization
 */

import { createApp } from './app';
import { initializeServices } from './services';
import { Logger } from './utils/logger';

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    Logger.info('Starting Employeah API Server...', { port });
    
    // Initialize services (database, queue, workers)
    await initializeServices();
    
    // Create and start the app
    const app = createApp();
    
    Logger.info('Server started successfully', { 
      port,
      endpoints: {
        health: '/health',
        api: '/api',
        docs: '/docs'
      }
    });
    
    return {
      port,
      app,
    };
  } catch (error: unknown) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().then((server) => {
  Logger.info(`Server running on port ${server.port}`);
}).catch((error) => {
  Logger.error('Server startup failed', error);
  process.exit(1);
});

export default startServer;
