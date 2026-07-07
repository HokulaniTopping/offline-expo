-- Mirrors the local SQLite `notes` table (see ../../lib/db/schema.ts) so PowerSync
-- can sync between them. Column names/types don't need to match exactly — PowerSync
-- maps Postgres types to SQLite-compatible types on the client — but keeping them
-- aligned makes the sync rules and client schema (step 3) easier to reason about.
create table public.notes (
  id uuid not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_pkey primary key (id)
);

-- Seed row to sanity-check downstream sync (Postgres -> device) once the client is wired up.
insert into notes (id, title, content)
values (gen_random_uuid(), 'Hello from Postgres', 'Inserted directly into Postgres. If this shows up on the phone, downstream sync works.');

-- PowerSync replicates via a Postgres publication — it only sees tables added here.
create publication powersync for table notes;
