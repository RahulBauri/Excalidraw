import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string; // or number, match your decoded token type
    }
  }
}
