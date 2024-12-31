import { Router } from 'express';
import multer from 'multer';
import { LergService } from '../services/lerg.service';
import * as path from 'path';
import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const lergService = new LergService();

// Configure multer for file upload
const upload = multer({
  dest: 'uploads/',
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

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const result = await lergService.processLergFile(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(result);
  } catch (error: unknown) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await lergService.getStats();
    res.json(stats);
  } catch (error: unknown) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await lergService.clearAllData();
    res.json({ message: 'All LERG data cleared successfully' });
  } catch (error: unknown) {
    console.error('Clear data error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { router as lergRoutes };
