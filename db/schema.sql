-- Run this once against your database to create the users table:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Safe to re-run: IF NOT EXISTS means it won't error if the table
-- already exists.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- gen_random_uuid() needs the pgcrypto extension on Postgres < 13.
-- On Postgres 13+ it's built in; this is harmless to run either way.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Case-insensitive lookups: emails are stored as given, but we always
-- query lowercased, so index the lowercased form for fast lookups.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));