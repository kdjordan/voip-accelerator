import express, { Request, Response } from 'express';
import { LERGService } from '@/services/lerg.service';
import { logger } from '@/config/logger';

const router = express.Router();
const lergService = new LERGService();

router.get('/init-special-codes', async (_req: Request, res: Response) => {
  logger.info('SERVER: Got a call to init special codes');
  try {
    const specialCodes = await lergService.getPublicSpecialCodes();
    res.json(specialCodes);
  } catch (error) {
    logger.error('Error initializing special codes', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/init-lerg-codes', async (_req: Request, res: Response) => {
  logger.info('SERVER: Got a call to init lerg codes');
  try {
    const lergCodes = await lergService.getPublicLergCodes();
    res.json(lergCodes);
  } catch (error) {
    logger.error('Error initializing LERG codes', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/test-connection', async (_req: Request, res: Response) => {
  try {
    await lergService.testConnection();
    logger.info('Connection test successful');
    res.json(true);
  } catch (error) {
    logger.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching stats');
    const stats = await lergService.getStats();
    logger.debug('Stats retrieved', stats);
    res.json(stats);
  } catch (error) {
    logger.error('Stats error', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

export { router as lergRoutes };
