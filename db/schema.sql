-- Run this once against your database to create the users table:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- Safe to re-run: IF NOT EXISTS means it won't error if the table
-- already exists.
CREATE TABLE
  IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
  );

-- gen_random_uuid() needs the pgcrypto extension on Postgres < 13.
-- On Postgres 13+ it's built in; this is harmless to run either way.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Case-insensitive lookups: emails are stored as given, but we always
-- query lowercased, so index the lowercased form for fast lookups.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

CREATE TABLE
  IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
    UNIQUE (user_id, platform)
  );

CREATE TABLE
  IF NOT EXISTS transfer_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    source_platform TEXT NOT NULL,
    destination_platform TEXT NOT NULL,
    source_playlist_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    total_tracks INT DEFAULT 0,
    matched_count INT DEFAULT 0,
    unmatched_count INT DEFAULT 0,
    unmatched_tracks JSON DEFAULT '[]',
    error TEXT,
    playlist_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  )