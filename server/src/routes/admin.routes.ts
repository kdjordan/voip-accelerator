import express, { Request, Response } from 'express';
import multer from 'multer';
import { LERGService } from '@/services/lerg.service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const lergService = new LERGService();

// Helper for consistent error responses
function handleError(message: string, error: unknown) {
  console.error(message, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    details: error instanceof Error ? error.stack : undefined,
  };
}

// POST /admin/lerg/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  console.log('got hit /upload', { file: req.file, body: req.body });
  try {
    if (!req.file) {
      console.error('[admin.routes.ts] No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const mappings = JSON.parse(req.body.mappings);
    const startLine = parseInt(req.body.startLine);

    if (!mappings || !startLine) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    console.info('[admin.routes.ts] Processing uploaded file');
    const result = await lergService.processLergFile(req.file.buffer, mappings, startLine);
    console.info('[admin.routes.ts] File processed successfully:', result);

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
    console.info('Clearing LERG data');
    await lergService.clearLergData();
    res.json({
      success: true,
      message: 'LERG codes data cleared successfully',
    });
  } catch (error) {
    res.status(500).json(handleError('Clear LERG data error', error));
  }
});

export const adminLergRoutes = router;
