import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { transporter } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

  const { data, error } = await supabaseAdmin().auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ error: error?.message ?? "No se pudo generar el link." }, { status: 500 });
  }

  const resetUrl = data.properties.action_link;
  const firstName = name ? name.split(" ")[0] : "";

  await transporter.sendMail({
    from: `"ACO Workspace" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reseteo de contraseña — ACO Workspace",
    html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 40px 16px;">
  <div style="max-width: 520px; margin: 0 auto;">

    <div style="text-align: center; margin-bottom: 32px;">
      <img src="${process.env.NEXT_PUBLIC_APP_URL}/aco-logo.webp" alt="ACO Workspace" style="height: 28px; width: auto; filter: brightness(0);" />
    </div>

    <div style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
      <div style="height: 5px; background: linear-gradient(90deg, #C0201A, #E03A1A);"></div>

      <div style="padding: 40px 36px;">
        <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #111111;">
          Reseteo de contraseña
        </h1>
        <p style="margin: 0 0 28px; font-size: 15px; color: #666666; line-height: 1.6;">
          Hola${firstName ? ` ${firstName}` : ""}. Recibimos una solicitud para restablecer la contraseña de tu cuenta en ACO Workspace. Hacé clic en el botón para elegir una nueva.
        </p>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${resetUrl}"
            style="display: inline-block; background: linear-gradient(135deg, #C0201A, #E03A1A); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 999px;">
            Elegir nueva contraseña
          </a>
        </div>

        <p style="margin: 0 0 8px; font-size: 13px; color: #999999; text-align: center;">
          Este link expira en 24 horas.
        </p>
        <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">
          Si no solicitaste este cambio, podés ignorar este mail.
        </p>
      </div>

      <div style="border-top: 1px solid #f0f0f0; padding: 20px 36px; background: #fafafa;">
        <p style="margin: 0; font-size: 12px; color: #bbbbbb; text-align: center;">
          ¿Tenés dudas? Escribinos a
          <a href="mailto:recepcion@acoworkspace.com" style="color: #C0201A; text-decoration: none;">recepcion@acoworkspace.com</a>
        </p>
      </div>
    </div>

    <p style="text-align: center; font-size: 12px; color: #bbbbbb; margin-top: 24px;">
      © ${new Date().getFullYear()} ACO Workspace · Palermo & Monserrat, Buenos Aires
    </p>
  </div>
</div>
    `,
  });

  return NextResponse.json({ ok: true });
}
