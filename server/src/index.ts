import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseService } from '@/services/database.service';
import { lergRoutes } from '@/routes/lerg.routes';
import { adminLergRoutes } from '@/routes/admin.routes';
import { authRoutes } from '@/routes/auth.routes';
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware';


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

// Initialize database service
const dbService = DatabaseService.getInstance();

// Routes
app.use('/api/lerg', lergRoutes);
app.use('/api/admin/lerg', adminAuthMiddleware, adminLergRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await dbService.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.log('Health check failed', error);
    res.status(500).json({ status: 'error' });
  }
});

async function startServer() {
  try {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.log('Server startup failed', error);
    process.exit(1);
  }
}

startServer();
