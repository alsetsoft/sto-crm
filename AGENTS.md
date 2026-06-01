# AGENTS.md

Project rules for AI agents working in this repo.

## Database / Supabase

- **Do NOT add more Supabase migration files.** Do not create new files under `supabase/migrations/`.
  Apply any schema changes directly against the live Supabase project via the Management API
  (`POST https://api.supabase.com/v1/projects/<ref>/database/query` with `SUPABASE_ACCESS_TOKEN`),
  not by adding migration files.
- The existing `supabase/migrations/0001_warehouse.sql` stays as the historical record of the
  initial schema — leave it in place, but do not add siblings to it.
