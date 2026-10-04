import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import billsRoutes from './routes/bills.js';
import paymentsRoutes from './routes/payments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/payments', paymentsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Zada Pharmacy Supplier Management System (SPMS)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build if it exists (in production)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  // If request isn't an API call, serve React index.html
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(404).send('Zada Supplier Web App is running. Build frontend with: npm run build');
      }
    });
  } else {
    res.status(404).json({ error: 'Endpoint not found' });
  }
});

async function start() {
  try {
    console.log('[Server] Connecting to MySQL and verifying schema...');
    await initDb();
    console.log('[Server] Database initialized successfully.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 ZADA PHARMACY SPMS WEB APP IS RUNNING!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

start();
