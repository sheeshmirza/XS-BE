import { createLogger, format, transports } from 'winston';
import env from '../config/env';
const logger = createLogger({ level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()] });
export default logger;
