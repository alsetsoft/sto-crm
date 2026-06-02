import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Vehicle auto-fill by state registration number.
 *
 * Provider: baza-gai.com.ua (Ukrainian plate lookup). Configure with
 * `BAZA_GAI_TOKEN` in the environment. Without a token the endpoint reports
 * `not_configured` so the UI can fall back to manual entry gracefully.
 */

interface NormalizedVehicle {
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  body_type: string | null;
}

function asText(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const cand = o.ua ?? o.uk ?? o.name ?? o.title;
    if (typeof cand === "string" && cand.trim()) return cand.trim();
  }
  return null;
}

function asYear(v: unknown): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 1900 && n < 2100 ? n : null;
}

export async function GET(request: Request) {
  // Owner-only (defence in depth; middleware already guards the session).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const plate = new URL(request.url).searchParams
    .get("plate")
    ?.replace(/\s+/g, "")
    .toUpperCase();

  if (!plate || plate.length < 4) {
    return NextResponse.json({ error: "invalid_plate" }, { status: 400 });
  }

  const token = process.env.BAZA_GAI_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  let res: Response;
  try {
    res = await fetch(`https://baza-gai.com.ua/nomer/${encodeURIComponent(plate)}`, {
      headers: { "X-Api-Key": token, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "provider_unreachable" }, { status: 502 });
  }

  if (res.status === 404) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) {
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }

  const normalized: NormalizedVehicle = {
    make: asText(raw.vendor) ?? asText(raw.make),
    model: asText(raw.model),
    year: asYear(raw.model_year ?? raw.year),
    vin: asText(raw.vin),
    body_type: asText(raw.body) ?? asText(raw.kind),
  };

  return NextResponse.json({ data: normalized });
}
