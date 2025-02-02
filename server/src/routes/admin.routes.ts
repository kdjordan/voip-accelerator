import express, { Request, Response } from 'express';
import multer from 'multer';
import { LERGService } from '@/services/lerg.service';
import { logger } from '@/config/logger';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const lergService = new LERGService();

// Helper for consistent error responses
function handleError(message: string, error: unknown) {
  logger.error(message, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    details: error instanceof Error ? error.stack : undefined,
  };
}

// All these routes will be protected by admin middleware
router.get('/special-codes/:country', async (req: Request, res: Response) => {
  try {
    const { country } = req.params;
    const result = await lergService.getSpecialCodesByCountry(country);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json(handleError('Error fetching special codes', error));
  }
});

// POST /admin/lerg/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      logger.error('No file uploaded', new Error('No file provided'));
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    logger.info('Processing uploaded file');
    const result = await lergService.processLergFile(req.file.buffer);
    logger.info('File processed successfully', result);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json(handleError('File processing failed', error));
  }
});

router.delete('/clear/lerg', async (_req: Request, res: Response) => {
  try {
    logger.info('Clearing LERG data');
    await lergService.clearLergData();
    res.json({
      success: true,
      message: 'LERG codes data cleared successfully',
    });
  } catch (error) {
    res.status(500).json(handleError('Clear LERG data error', error));
  }
});

router.delete('/clear/special', async (_req: Request, res: Response) => {
  try {
    logger.info('Clearing special codes data');
    await lergService.clearSpecialCodesData();
    res.json({
      success: true,
      message: 'Special codes data cleared successfully',
    });
  } catch (error) {
    res.status(500).json(handleError('Clear special codes error', error));
  }
});

router.post('/reload/special', async (_req: Request, res: Response) => {
  try {
    logger.info('Reloading special codes');
    await lergService.reloadSpecialCodes();
    res.json({
      success: true,
      message: 'Special codes reloaded successfully',
    });
  } catch (error) {
    res.status(500).json(handleError('Reload special codes error', error));
  }
});

export const adminLergRoutes = router;
