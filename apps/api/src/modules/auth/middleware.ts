import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized — please log in' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.APP_AUTH_SECRET ?? 'change-me';

  try {
    const payload = jwt.verify(token, secret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: 'Token expired or invalid — please log in again' });
  }
};
