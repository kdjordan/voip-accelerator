import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DatabaseService } from './domains/shared/services/database.service';
import { lergRoutes } from './domains/lerg/routes/lerg.routes';

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
app.use(express.json());

// Initialize database service
const dbService = DatabaseService.getInstance();

// Mount routes - Fix the mounting path to match the client's request
app.use('/api/admin/lerg', lergRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await dbService.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
