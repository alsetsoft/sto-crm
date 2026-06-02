import { createClient } from "@/lib/supabase/client";

/** Supabase Storage bucket holding order (intake) photos. */
export const ORDERS_BUCKET = "orders";

/** Uploads an order photo to storage and returns its public URL. */
export async function uploadOrderPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(ORDERS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(ORDERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
