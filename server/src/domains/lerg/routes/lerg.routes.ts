import express, { Request, Response } from 'express';
import { LERGService } from '../services/lerg.service';

const router = express.Router();
const lergService = new LERGService();

router.get('/init-special-codes', async (_req: Request, res: Response) => {
  try {
    const specialCodes = await lergService.getPublicSpecialCodes();
    res.json({
      success: true,
      data: specialCodes,
      count: specialCodes.length,
    });
  } catch (error) {
    console.error('Error initializing special codes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/init-lerg-codes', async (_req: Request, res: Response) => {
  try {
    const lergCodes = await lergService.getPublicLergCodes();
    res.json({
      success: true,
      data: lergCodes,
      count: lergCodes.length,
    });
  } catch (error) {
    console.error('Error initializing LERG codes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/test-connection', async (_req: Request, res: Response) => {
  try {
    await lergService.testConnection();
    res.json({ success: true });
  } catch (error) {
    console.error('Test connection failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as lergRoutes };
