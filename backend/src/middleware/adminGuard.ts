import { Request, Response, NextFunction } from 'express';
import { hasAdminSession } from '../services/adminSession';

export function adminGuard(req: Request, res: Response, next: NextFunction) {
  if (!hasAdminSession(req)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
