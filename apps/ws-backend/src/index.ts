import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

import { JWT_SECRET } from '@repo/backend-common/config';
import { prismaClient } from '@repo/db/client';

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JwtPayload & {
      userId: string;
    };

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    console.log(error);
    return null;
  }
}

const wss = new WebSocketServer({ port: 8080 }, () => {
  console.log('ws-backend server is running on port 8080');
});

interface User {
  ws: WebSocket;
  rooms: number[];
  userId: string;
}

// Global state for our ws server
const users: User[] = [];

wss.on('connection', function connection(ws, request) {
  const url = request.url;

  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || '';

  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    ws,
    rooms: [],
  });

  ws.on('error', console.error);

  ws.on('message', async function message(data) {
    const parsedData = JSON.parse(data as unknown as string);

    if (parsedData.type === 'join_room') {
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(Number(parsedData.roomId));
    }

    if (parsedData.type === 'leave_room') {
      const user = users.find((x) => x.ws === ws);
      if (!user) return;
      user.rooms = user?.rooms.filter((x) => x !== Number(parsedData.roomId));
    }

    if (parsedData.type === 'chat') {
      const { roomId, message } = parsedData;

      // first store the message in the DB
      try {
        await prismaClient.chat.create({
          data: {
            roomId,
            message,
            userId,
          },
        });
      } catch (error) {
        console.log(error);
        return;
      }

      // NOTE: 'await' blocks the code below it — the broadcast won't happen until the DB write finishes. For a chat app this adds latency.
      // Using a queue (Kafka or Redis) is better at scale because:
      // - DB writes don't block anything
      // - If the DB is slow or down, messages are queued and retried
      // - You can batch writes for efficiency

      // then broadcast to everyone
      users.forEach((user) => {
        if (user.rooms.includes(Number(roomId))) {
          user.ws.send(
            JSON.stringify({
              type: 'chat',
              message,
              roomId,
            }),
          );
        }
      });
    }
  });

  // ws.send(userId);
});
