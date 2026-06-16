import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, email, telefono, tipo, sedes, mensaje } = body;

  if (!nombre || !email || !mensaje) {
    return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
  }

  const sedesTexto = Array.isArray(sedes) ? sedes.join(", ") : sedes;

  try {
    await transporter.sendMail({
      from: `"ACO Workspace" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `Nuevo contacto web — ${nombre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: linear-gradient(135deg, #C0201A, #E03A1A); height: 4px; border-radius: 4px 4px 0 0;"></div>
          <div style="padding: 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="margin: 0 0 24px; font-size: 20px;">Nuevo mensaje desde la web</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; width: 40%;">Nombre</td><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${nombre}</td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">Email</td><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}" style="color: #C0201A;">${email}</a></td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">Teléfono</td><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${telefono || "—"}</td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">Tipo</td><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${tipo || "—"}</td></tr>
              <tr><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600;">Sede/s de interés</td><td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">${sedesTexto || "—"}</td></tr>
            </table>
            <div style="margin-top: 24px;">
              <p style="font-weight: 600; margin-bottom: 8px;">Mensaje</p>
              <p style="background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 0; line-height: 1.6;">${mensaje}</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al enviar el email." }, { status: 500 });
  }
}
