import { Request, Response, NextFunction } from 'express';

export function adminGuard(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
