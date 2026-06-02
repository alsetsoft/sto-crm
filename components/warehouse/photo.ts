import { createClient } from "@/lib/supabase/client";

/** Supabase Storage bucket holding warehouse-item photos. */
export const WAREHOUSE_BUCKET = "warehouse";

/**
 * Uploads a warehouse-item photo to storage and returns its public URL.
 * Throws on failure so callers can surface a toast.
 */
export async function uploadWarehousePhoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(WAREHOUSE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(WAREHOUSE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
