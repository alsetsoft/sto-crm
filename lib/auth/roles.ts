// Pure role constants & types — safe to import from client components.
// (Keep this free of server-only deps like next/headers.)

/** The single super-user; mirrors the RLS `is_owner()` check. */
export const OWNER_EMAIL = "lybomur6@gmail.com";

export type ViewerRole = "owner" | "admin" | "master" | null;

export interface Viewer {
  email: string | null;
  /** Display name: employee full name, or "Власник" for the owner. */
  name: string | null;
  role: ViewerRole;
  /** Owner & admin may see internal financials (costs, margins, payments). */
  canSeeFinancials: boolean;
}

export const ROLE_LABEL: Record<NonNullable<ViewerRole>, string> = {
  owner: "Власник",
  admin: "Адміністратор",
  master: "Майстер",
};
