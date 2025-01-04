import { Request, Response, NextFunction } from 'express';

// Temporary middleware that allows all requests through
// TODO: Implement proper authentication
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // For now, just pass through
  next();
}
