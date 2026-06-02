import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { JWT_SECRET } from '@repo/backend-common/config';
import {
  CreateUserSchema,
  SigninUserSchema,
  CreateRoomSchema,
} from '@repo/common/types';
import jwt from 'jsonwebtoken';
import { middleware } from './middleware';

const app = express();

app.post('/signup', (req, res) => {
  const data = CreateUserSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }

  res.json({ userId: 123 });
});

app.post('/signin', (req, res) => {
  const data = SigninUserSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }

  const userId = '123';
  const token = jwt.sign({ userId }, JWT_SECRET as string);

  res.json({ token });
});

app.post('/room', middleware, (req, res) => {
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }

  res.json({
    roomId: 123,
  });
});

app.listen(3001, () => {
  console.log('http-backend server is running on port 3001');
});
