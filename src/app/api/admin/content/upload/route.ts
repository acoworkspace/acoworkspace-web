import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";

const HEIC_TYPES = ["image/heic", "image/heif", "image/heic-sequence"];

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const path = form.get("path") as string | null;

  if (!file || !path) return NextResponse.json({ error: "Missing file or path" }, { status: 400 });

  const admin = supabaseAdmin();
  const rawBytes = Buffer.from(await file.arrayBuffer());
  let uploadBytes: Buffer | Uint8Array = rawBytes;
  let contentType = file.type;
  let storagePath = path;

  // Convert HEIC/HEIF to JPEG
  const isHeic = HEIC_TYPES.includes(file.type.toLowerCase()) ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif");

  if (isHeic) {
    uploadBytes = await sharp(rawBytes).rotate().jpeg({ quality: 90 }).toBuffer();
    contentType = "image/jpeg";
    storagePath = path.replace(/\.(heic|heif)$/i, ".jpg");
    if (!storagePath.endsWith(".jpg")) storagePath += ".jpg";
  }

  const { error } = await admin.storage
    .from("site-assets")
    .upload(storagePath, uploadBytes, { contentType, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/${storagePath}`;
  return NextResponse.json({ ok: true, url });
}
