import { Router } from 'express';
import { pool } from '../db.js';

export const notesRouter = Router();

// Column allowlist — PATCH builds its SET clause from request body keys, so this
// guards against arbitrary column names being spliced into the query string.
const ALLOWED_FIELDS = ['title', 'content', 'created_at', 'updated_at'];

notesRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, created_at, updated_at } = req.body;
  await pool.query(
    `insert into notes (id, title, content, created_at, updated_at)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update set title = $2, content = $3, updated_at = $5`,
    [id, title, content, created_at, updated_at]
  );
  res.status(204).end();
});

notesRouter.patch('/:id', async (req, res) => {
  const fields = Object.keys(req.body).filter((field) => ALLOWED_FIELDS.includes(field));
  if (fields.length === 0) {
    res.status(204).end();
    return;
  }
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  const values = fields.map((field) => req.body[field]);
  await pool.query(`update notes set ${setClause} where id = $1`, [req.params.id, ...values]);
  res.status(204).end();
});

notesRouter.delete('/:id', async (req, res) => {
  await pool.query('delete from notes where id = $1', [req.params.id]);
  res.status(204).end();
});
