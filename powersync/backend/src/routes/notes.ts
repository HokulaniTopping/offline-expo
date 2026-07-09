import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const notesRouter = Router();

notesRouter.use(requireAuth);

// Column allowlist — PATCH builds its SET clause from request body keys, so this
// guards against arbitrary column names being spliced into the query string.
const ALLOWED_FIELDS = ['title', 'content', 'created_at', 'updated_at'];

notesRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, created_at, updated_at } = req.body;
  // The `where notes.user_id = $2` guard on the update branch matters: without it,
  // a client could PUT an id belonging to another user's existing row and silently
  // take it over via the upsert, even though the insert branch is user_id-scoped.
  await pool.query(
    `insert into notes (id, user_id, title, content, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set title = $3, content = $4, updated_at = $6
       where notes.user_id = $2`,
    [id, req.userId, title, content, created_at, updated_at]
  );
  res.status(204).end();
});

notesRouter.patch('/:id', async (req, res) => {
  const fields = Object.keys(req.body).filter((field) => ALLOWED_FIELDS.includes(field));
  if (fields.length === 0) {
    res.status(204).end();
    return;
  }
  const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ');
  const values = fields.map((field) => req.body[field]);
  await pool.query(`update notes set ${setClause} where id = $1 and user_id = $2`, [
    req.params.id,
    req.userId,
    ...values,
  ]);
  res.status(204).end();
});

notesRouter.delete('/:id', async (req, res) => {
  await pool.query('delete from notes where id = $1 and user_id = $2', [req.params.id, req.userId]);
  res.status(204).end();
});
