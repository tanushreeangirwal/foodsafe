import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDb } from './db';

import authRoutes from './routes/auth';
import businessRoutes from './routes/businesses';
import categoryRoutes from './routes/categories';
import templateRoutes from './routes/templates';
import requirementRoutes from './routes/requirements';
import evidenceRoutes from './routes/evidence';
import regulatoryRoutes from './routes/regulatory';
import notificationRoutes from './routes/notifications';
import auditRoutes from './routes/audit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence documents
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/regulatory', regulatoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'FOODSAFE Food Safety & Compliance Management Platform',
    version: '1.0.0-poc',
    timestamp: new Date().toISOString()
  });
});

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 FOODSAFE API Server running smoothly on http://localhost:${PORT}`);
      console.log(`📁 Uploads served from ${uploadsDir}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database and server:', err);
    process.exit(1);
  }
}

startServer();
