import { createClient } from "@/lib/supabase/server";
import { OWNER_EMAIL, type Viewer } from "@/lib/auth/roles";

export { OWNER_EMAIL, ROLE_LABEL } from "@/lib/auth/roles";
export type { Viewer, ViewerRole } from "@/lib/auth/roles";

/**
 * Resolves the current authenticated user's role for the app.
 * Owner → financial access; employees map to their `employees.role`
 * (admin sees financials, master does not). Per the spec there are no
 * per-role route guards — only financial visibility differs.
 */
export async function getViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  if (!email) return { email: null, name: null, role: null, canSeeFinancials: false };
  if (email.toLowerCase() === OWNER_EMAIL)
    return { email, name: "Власник", role: "owner", canSeeFinancials: true };

  const { data } = await supabase
    .from("employees")
    .select("full_name, role")
    .eq("email", email)
    .maybeSingle();

  const role = (data?.role as "admin" | "master" | undefined) ?? null;
  return {
    email,
    name: data?.full_name ?? null,
    role,
    canSeeFinancials: role === "admin",
  };
}
