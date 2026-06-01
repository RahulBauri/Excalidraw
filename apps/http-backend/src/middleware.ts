import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'] || '';

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload & {
      userId: string;
    };

    if (decoded) {
      req.userId = decoded.userId;
      next();
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: 'you are not signed in' });
  }
};
