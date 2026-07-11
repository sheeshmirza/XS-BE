const app = require('./app');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');
const { initializePostQueue } = require('./queue/postQueue');

const startServer = async () => {
  await connectDatabase();
  await initializePostQueue();

  app.listen(env.port, () => {
    logger.info(`XSocial backend running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error({ message: 'Failed to start server', error });
  process.exit(1);
});
