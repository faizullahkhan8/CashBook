import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import closingRoutes from './modules/closings/closing.routes.js';
import syncRoutes from './modules/sync/sync.routes.js';
import { optionalAuth } from './core/middleware/optional-auth.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('tiny'));
  app.get('/api/health', (_, res) => res.json({ ok: true, service: 'zada-ceo-server', version: 1 }));
  app.use('/api/v1', optionalAuth);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/closings', closingRoutes);
  app.use('/api/v1/sync', syncRoutes);
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(error?.name === 'ZodError' ? 400 : 500).json({ message: error.message || 'Server error' });
  });
  return app;
}
