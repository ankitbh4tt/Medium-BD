import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { cors } from 'hono/cors'
import { userRouter } from './Routes/userRouter'
import { blogRouter } from './Routes/blogRouter'
import { Context } from 'hono' // Import Context type

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string,
    JWT_SECRET: string
  }
}>()


app.use('*', cors({
  origin: (origin: string, c: Context) => {
    const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    console.log('Request Origin:', origin); // Log the incoming origin
    const allowedOrigin = allowedOrigins.includes(origin || '') ? origin || '' : '';
    console.log('Returning Origin:', allowedOrigin); // Log what’s returned
    return allowedOrigin;
  },
  allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
  credentials: true,
}));

app.route('/api/v1/user', userRouter)
app.route('/api/v1/blog', blogRouter)

export default app