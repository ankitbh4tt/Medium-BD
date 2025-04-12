import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign, verify } from 'hono/jwt';
import { cors } from 'hono/cors';
import { userRouter } from './Routes/userRouter';
import { blogRouter } from './Routes/blogRouter';
import { Context } from 'hono'; // Import Context type

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  }
}>();

app.use('*', cors({
  origin: (origin: string, c: Context) => {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    console.log('Request Origin:', origin); // Debug log
    if (!origin || !allowedOrigins.includes(origin)) {
      console.log('Origin not allowed, defaulting to first allowed origin');
      return allowedOrigins[0]; // Default to first allowed origin if not matched
    }
    return origin;
  },
  allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true, // Enable credentials if your app uses cookies or Authorization headers
}));

app.route('/api/v1/user', userRouter);
app.route('/api/v1/blog', blogRouter);

export default app;