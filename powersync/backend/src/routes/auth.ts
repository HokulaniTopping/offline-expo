import { Router } from 'express';
import { DEMO_USER_IDS, mintDemoToken } from '../auth.js';

export const authRouter = Router();

// No real login yet — pick a demo identity via ?demo=user-a (defaults to the first).
// See auth.ts for why this is the one spot that changes when real login replaces it.
authRouter.get('/token', (req, res) => {
  const demoUserId = typeof req.query.demo === 'string' ? req.query.demo : DEMO_USER_IDS[0];
  try {
    res.json({
      token: mintDemoToken(demoUserId),
      endpoint: process.env.PS_PUBLIC_URL,
    });
  } catch {
    res.status(400).json({ error: `Unknown demo user: ${demoUserId}` });
  }
});
