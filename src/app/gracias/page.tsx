import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¡Gracias! — ACO Workspace",
  robots: { index: false },
};

export default function GraciasPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <div className="max-w-md">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">¡Gracias por escribirnos!</h1>
        <p className="text-neutral-500 text-lg mb-8">
          Recibimos tu consulta. En breve nos ponemos en contacto con vos.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full text-white font-medium hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
