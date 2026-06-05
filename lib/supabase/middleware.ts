import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth"];

// Only the Склад (warehouse) module is available for now. Every other app
// route is temporarily gated and redirected here. Add prefixes as modules ship.
const AVAILABLE_PREFIXES = ["/sklad"];

function isReachable(pathname: string): boolean {
  if (pathname === "/") return true; // root redirects to /sklad in the page
  if (pathname.startsWith("/api")) return true; // internal API routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  return AVAILABLE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sklad";
    return NextResponse.redirect(url);
  }

  // Gate every not-yet-available module to the warehouse.
  if (user && !isReachable(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sklad";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
