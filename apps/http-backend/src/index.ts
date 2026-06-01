import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { JWT_SECRET } from '@repo/backend-common/config';
import jwt from 'jsonwebtoken';
import { middleware } from './middleware';

const app = express();

app.post('/signup', (req, res) => {
  res.json({ userId: 123 });
});

app.post('/signin', (req, res) => {
  const userId = '123';
  const token = jwt.sign({ userId }, JWT_SECRET as string);

  res.json({ token });
});

app.post('/room', middleware, (req, res) => {
  res.json({
    roomId: 123,
  });
});

app.listen(3001, () => {
  console.log('http-backend server is running on port 3001');
});
