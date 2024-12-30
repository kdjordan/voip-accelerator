import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { DatabaseService } from './domains/shared/services/database.service';
import { lergRoutes } from './domains/lerg/routes/lerg.routes';

// Load environment variables
dotenv.config();

// Log the database configuration (temporary, for debugging)
console.log('Database Config:', {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Don't log the password
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database service
const dbService = DatabaseService.getInstance();

// Health check endpoint with DB status
app.get('/health', async (req, res) => {
  try {
    await dbService.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use('/api/lerg', lergRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
