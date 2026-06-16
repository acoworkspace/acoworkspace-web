import { supabaseAdmin } from "./supabase";

export type ContentMap = Record<string, string>;

// Fetch all content for one or more sections
export async function getSiteContent(...sections: string[]): Promise<ContentMap> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("site_content")
    .select("section, key, value")
    .in("section", sections);

  const map: ContentMap = {};
  for (const row of data ?? []) {
    map[`${row.section}.${row.key}`] = row.value ?? "";
  }
  return map;
}

// Get a single value with a fallback
export function get(map: ContentMap, key: string, fallback = ""): string {
  return map[key] ?? fallback;
}

// Supabase Storage public URL helper
export function storageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/${path}`;
}
