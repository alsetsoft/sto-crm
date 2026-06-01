# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & commands

- **Next.js 15 (App Router) + React 19 + TypeScript** + **Tailwind CSS** + **shadcn/ui** (Radix primitives, `components/ui/`).
- **Supabase** backend via `@supabase/ssr` (cookie sessions). Browser/server/middleware clients in `lib/supabase/`.
- Commands: `npm run dev`, `npm run build`, `npm run lint`. Env in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`); `SUPABASE_ACCESS_TOKEN` (Management-API PAT) is used out-of-band for migrations.

**Build order:** development starts from the **Склад (Warehouse)** module (done), then other modules; migrate existing data per the requirements doc.

### Supabase notes (learned the hard way)
- The DB schema lives in `supabase/migrations/`. There is **no working Supabase MCP** in-session — the `.mcp.json` server isn't loaded. Apply SQL via the **Management API** (`POST https://api.supabase.com/v1/projects/<ref>/database/query`) with `SUPABASE_ACCESS_TOKEN`. That PAT **must belong to the account that owns project `hbiohlnjosbgjfaicjae`** (an earlier token only had access to unrelated "Cargo Transportation" projects → 403).
- Hand-written `Database` types in `lib/supabase/types.ts` **must use `type` aliases, not `interface`** (interfaces lack the implicit index signature, so the schema degrades to `never` and `.insert()/.update()` break). Keep `@supabase/ssr` and `@supabase/supabase-js` on compatible majors (ssr ≥0.10 for supabase-js ≥2.106) or generics misalign.

### Auth model
- Single **owner** account (`lybomur6@gmail.com`), email+password. Public sign-ups are **disabled** in the project's auth config. `middleware.ts` redirects unauthenticated requests to `/login`.
- Every table is owner-scoped by RLS: policies gate on `auth.jwt() ->> 'email' = 'lybomur6@gmail.com'`. Replicate this policy on new tables.

## Domain

This is a CRM for an auto-service station (СТО). The full functional spec is in
[docs/Функціональні вимоги для СТО.md](docs/Функціональні%20вимоги%20для%20СТО.md) — read it before building any module. Key facts that cut across the whole app:

- **Language is Ukrainian; currency is the hryvnia (₴).** All UI text is in Ukrainian.
- **No access control between roles.** Roles exist (Майстер / Адміністратор) but share one interface — the only role-gated behavior is financial visibility (below). Do not build per-role route guards or permissions.

### Required terminology (non-negotiable naming)

- The orders module is called **«План»** — never «Наряд-замовлення». An individual order is a *наряд*; the section listing them is «План».
- The customers module is called **«Клієнти»** — never «Замовники».

### Order status → block color

Status colors apply to the **entire order block**, not just a badge or text:

| Статус | Колір блоку |
| --- | --- |
| Запис | Сірий (grey) |
| Прийнято | Синій (blue) |
| В роботі | Помаранчевий / жовтий (orange/yellow) |
| Готово | Зелений (green) |
| Розраховано | Фіолетовий (purple) |
| Проблема | Червоний (red) |

### Financial-visibility rule (the one role-dependent behavior)

- Workers (Майстер) must **not** see internal financials of an order — only the final order total.
- Exception: orders in status **«Розраховано»**, where financial visibility is determined by the user's role.

### Cross-module business rules to enforce

- **Проблеми (Problems):** a problem can only be created while its order is in status **«В роботі»**, and is always tied to a specific order. Each has criticality (low/medium/high) and status (open/closed); a manager resolves it via a «Вирішити проблему» action.
- **Склад (Warehouse):** each item has an input (вхідна) and output (вихідна) price; **margin** is computed from these. Parts used on an order are auto-deducted from stock. Highlight items below minimum stock and those in negative.
- **Order creation** is a 3-step wizard: select/create client → select/create car (auto-fill make/model/year via the registration-number lookup API) → describe the request.
- **Звітність (Reporting)** lives under Працівники: per-worker individual percentage of completed work, accruals, and payouts, filterable by week / month / year / custom range.
- **Documents:** the app must generate printable «Акт приймання авто» (intake act) and «Акт виконаних робіт» (work-completion act).

### Integrations

- Vehicle data auto-fill by registration (state) number via an external API.
- Order photos are added/forwarded via **Telegram**.

## Environment

Secrets live in `.env` (gitignored); `.env.example` documents required keys. `SUPABASE_ACCESS_TOKEN` is needed for the Supabase MCP server defined in `.mcp.json`.
