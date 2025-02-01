import { Router } from 'express';

const router = Router();

// TODO: Implement login endpoint
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export { router as authRoutes };
