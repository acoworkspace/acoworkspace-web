import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { transporter } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email, password, full_name } = await req.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Notify reception of new pending user
  try {
    await transporter.sendMail({
      from: `"ACO Workspace" <${process.env.GMAIL_USER}>`,
      to: "recepcion@acoworkspace.com",
      subject: `Nuevo usuario pendiente de aprobación — ${full_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: linear-gradient(135deg, #C0201A, #E03A1A); height: 4px; border-radius: 4px 4px 0 0;"></div>
          <div style="padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="margin: 0 0 8px; font-size: 22px;">Nuevo usuario pendiente de aprobación</h2>
            <p style="margin: 0 0 24px; color: #666;">Un nuevo usuario se registró en ACO Workspace y está esperando ser aprobado.</p>
            <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 6px 0; color: #666; width: 40%;">Nombre</td><td style="padding: 6px 0; font-weight: 500;">${full_name}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0; font-weight: 500;">${email}</td></tr>
                <tr><td style="padding: 6px 0; color: #666;">Estado</td><td style="padding: 6px 0;"><span style="background: #fef9c3; color: #854d0e; padding: 2px 10px; border-radius: 999px; font-size: 13px; font-weight: 600;">Pendiente</span></td></tr>
              </table>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/clientes" style="display: inline-block; background: linear-gradient(135deg, #C0201A, #E03A1A); color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 500;">Ir al panel de clientes</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Reception new user notification failed:", err);
  }

  return NextResponse.json({ ok: true, user: data.user });
}
