import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import env from './config/env';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import requestLogger from './middleware/requestLogger';
import apiV1Routes from './routes/v1';
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(
  rateLimit({ windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please retry later' } })
);
const swaggerPath = path.join(__dirname, 'docs', 'openapi.yaml');
const swaggerDocument = YAML.load(swaggerPath);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/health', (_req, res) => { res.status(200).json({ success: true, message: 'Server is healthy' }); });
app.use(env.apiPrefix, apiV1Routes);
app.use(notFound);
app.use(errorHandler);
export default app;
