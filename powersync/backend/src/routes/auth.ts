import { Router } from 'express';
import { mintDevToken } from '../auth.js';

export const authRouter = Router();

authRouter.get('/token', (_req, res) => {
  res.json({
    token: mintDevToken(),
    endpoint: process.env.PS_PUBLIC_URL,
  });
});
