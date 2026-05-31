import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const wss = new WebSocketServer({ port: 8080 }, () => {
  console.log('ws-backend server is running on port 8080');
});

wss.on('connection', function connection(ws, request) {
  const url = request.url;

  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || '';

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string,
  ) as JwtPayload & { userId: string };

  if (!decoded || !decoded.userId) {
    ws.close();
    return;
  }

  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});
