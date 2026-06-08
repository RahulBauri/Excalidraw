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
import { prismaClient } from '@repo/db/client';

const app = express();
app.use(express.json());

app.post('/signup', async (req, res) => {
  const zodResponse = CreateUserSchema.safeParse(req.body);
  if (!zodResponse.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }

  const { username, password, name } = zodResponse.data;

  try {
    const user = await prismaClient.user.create({
      data: {
        email: username,
        password,
        name,
      },
    });
    res.json({ userId: user.id });
  } catch (error) {
    res.json(error);
  }
});

app.post('/signin', async (req, res) => {
  const zodResponse = SigninUserSchema.safeParse(req.body);
  if (!zodResponse.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: zodResponse.data.username,
        password: zodResponse.data.password,
      },
    });

    if (!user) {
      return res.json({ message: 'Not authorized' });
    }

    const userId = user?.id;
    const token = jwt.sign({ userId }, JWT_SECRET as string);

    res.json({ token });
  } catch (error) {
    res.json(error);
  }
});

app.post('/room', middleware, async (req, res) => {
  const zodResponse = CreateRoomSchema.safeParse(req.body);
  if (!zodResponse.success) {
    return res.json({
      message: 'Incorrect inputs',
    });
  }

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: zodResponse.data.name,
        adminId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (error) {
    res.json(error);
  }
});

app.get('/chats/:roomId', async (req, res) => {
  const { roomId } = req.params;

  const messages = await prismaClient.chat.findMany({
    where: {
      roomId: Number(roomId),
    },
    orderBy: {
      id: 'desc',
    },
    take: 50,
  });

  res.json({ messages });
});

app.listen(3001, () => {
  console.log('http-backend server is running on port 3001');
});
