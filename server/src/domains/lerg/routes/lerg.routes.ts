import { Router } from 'express';
import multer from 'multer';
import { LERGService } from '../services/lerg.service';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const lergService = new LERGService();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed'));
    }
  },
});

// Add error handling middleware
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File is too large. Maximum size is 500MB',
      });
    }
  }
  next(error);
});

// All these routes will be protected by admin middleware
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await lergService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await lergService.processLergFile(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
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

router.post('/reload/lerg', async (_req: Request, res: Response) => {
  try {
    await lergService.reloadLergData();
    res.json({ message: 'LERG data reloaded successfully' });
  } catch (error) {
    console.error('Reload LERG data error:', error);
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

export { router as lergRoutes };
