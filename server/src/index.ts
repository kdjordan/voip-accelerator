import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseService } from './domains/shared/services/database.service';
import { lergRoutes } from './domains/lerg';
import { adminAuthMiddleware } from './domains/auth/middleware/admin-auth.middleware';
import { authRoutes } from './domains/auth/routes/auth.routes';
import path from 'path';
import fs from 'fs';
import { adminLergRoutes } from './domains/lerg/routes/admin.routes';

// Load environment variables
dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '500mb' }));
app.use(express.raw({ type: 'text/plain', limit: '500mb' }));

// Initialize database service
const dbService = DatabaseService.getInstance();

// Mount routes - Fix the mounting path to match the client's request
app.use('/api/lerg', adminAuthMiddleware, lergRoutes);

// Separate route for admin login
app.use('/api/auth', authRoutes);

// Admin routes with auth middleware
app.use('/api/admin/lerg', adminAuthMiddleware, adminLergRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await dbService.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

async function runMigrations() {
  const db = DatabaseService.getInstance();
  const migrationsPath = path.join(__dirname, 'domains/lerg/migrations');

  try {
    // Read migration files in order
    const files = await fs.promises.readdir(migrationsPath);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const sql = await fs.promises.readFile(path.join(migrationsPath, file), 'utf-8');
      await db.query(sql);
    }
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Add this to your server startup
async function startServer() {
  try {
    await runMigrations();
    // ... rest of your server startup code
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
