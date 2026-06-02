# AGENTS.md

Project rules for AI agents working in this repo.

## UI / UX

- **No modals/dialogs for create & edit flows.** Creating or editing an entity
  (e.g. a warehouse position) must use a dedicated sub-page/route, never a modal
  or `Dialog`. Add the form under a child route (e.g. `/sklad/nova`) and navigate
  to it. Modals/dialogs are acceptable only for lightweight confirmations.

## Database / Supabase

- **Do NOT add more Supabase migration files.** Do not create new files under `supabase/migrations/`.
  Apply any schema changes directly against the live Supabase project via the Management API
  (`POST https://api.supabase.com/v1/projects/<ref>/database/query` with `SUPABASE_ACCESS_TOKEN`),
  not by adding migration files.
- The existing `supabase/migrations/0001_warehouse.sql` stays as the historical record of the
  initial schema — leave it in place, but do not add siblings to it.
