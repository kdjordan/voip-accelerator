import express, { Request, Response } from 'express';
import { LERGService } from '@/services/lerg.service';
import { logger } from '@/config/logger';

const router = express.Router();
const lergService = new LERGService();

router.get('/lerg-data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await lergService.getLergData();
    res.json(data).status(200);
  } catch (error) {
    logger.error('Error fetching LERG data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/test-connection', async (_req: Request, res: Response): Promise<void> => {
  try {
    const hasData = await lergService.testConnection();
    res.json(hasData);
  } catch (error) {
    logger.error('[lerg.routes.ts] Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as lergRoutes };
