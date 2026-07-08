import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { notesRouter } from './routes/notes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/notes', notesRouter);

const port = Number(process.env.BACKEND_PORT ?? 8081);
app.listen(port, () => {
  console.log(`PowerSync backend listening on :${port}`);
});
