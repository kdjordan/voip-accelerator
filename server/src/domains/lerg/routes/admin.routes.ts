import express, { Request, Response } from 'express';
import multer from 'multer';
import { LERGService } from '../services/lerg.service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const lergService = new LERGService();

// All these routes will be protected by admin middleware
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    console.log('Fetching stats...');
    const stats = await lergService.getStats();
    console.log('Stats retrieved:', JSON.stringify(stats, null, 2));
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// POST /admin/lerg/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await lergService.processLergFile(req.file.buffer);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/clear/lerg', async (_req: Request, res: Response) => {
  try {
    await lergService.clearLergData();
    res.json({ message: 'LERG codes data cleared successfully' });
  } catch (error) {
    console.error('Clear LERG data error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/special-codes/:country', async (req: Request, res: Response) => {
  try {
    const { country } = req.params;
    const result = await lergService.getSpecialCodesByCountry(country);
    res.json(result);
  } catch (error) {
    console.error('Error fetching special codes by country:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/clear/special', async (_req: Request, res: Response) => {
  try {
    await lergService.clearSpecialCodesData();
    res.json({ message: 'Special codes data cleared successfully' });
  } catch (error) {
    console.error('Clear special codes error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


router.post('/reload/special', async (_req: Request, res: Response) => {
  console.log('Received request to reload special codes');
  try {
    console.log('Calling reloadSpecialCodes service method');
    await lergService.reloadSpecialCodes();
    console.log('Successfully reloaded special codes');
    res.json({ message: 'Special codes reloaded successfully' });
  } catch (error) {
    console.error('Reload special codes error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});


export const adminLergRoutes = router;
