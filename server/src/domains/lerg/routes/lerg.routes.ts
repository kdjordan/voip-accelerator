import express from 'express';
import { LERGService } from '../services/lerg.service';

const router = express.Router();
const lergService = new LERGService();

router.get('/test-connection', async (req, res) => {
  try {
    await lergService.testConnection();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await lergService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/upload', express.raw({ type: 'text/csv', limit: '50mb' }), async (req, res) => {
  try {
    const result = await lergService.uploadLERGData(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const lergRoutes = router;
