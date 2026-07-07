import { Pool } from 'pg';

// PG_DATABASE_HOST defaults to localhost for running the backend outside Docker;
// docker-compose overrides it to the `pg-db` service alias.
export const pool = new Pool({
  host: process.env.PG_DATABASE_HOST ?? 'localhost',
  port: Number(process.env.PG_DATABASE_PORT ?? 5432),
  user: process.env.PG_DATABASE_USER,
  password: process.env.PG_DATABASE_PASSWORD,
  database: process.env.PG_DATABASE_NAME,
});
