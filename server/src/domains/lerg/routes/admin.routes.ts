import express from 'express';
import multer from 'multer';
import { LERGService } from '../services/lerg.service';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const lergService = new LERGService();

// POST /admin/lerg/upload
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    lergService
      .processLERGFile(req.file.buffer)
      .then(result => res.json(result))
      .catch(error => {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const adminLergRoutes = router;
