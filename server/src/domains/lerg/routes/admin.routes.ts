import express, { Request, Response } from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import { LERGService } from '../services/lerg.service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const lergService = new LERGService();

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

router.get('/test-connection', async (_req: Request, res: Response) => {
  try {
    // We can use a simple query to test the connection
    await lergService.testConnection();
    res.json({ success: true });
  } catch (error) {
    console.error('Test connection failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const adminLergRoutes = router;
