"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error" | "invalid">("idle");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the tokens in the URL hash after redirect
    const hash = window.location.hash;
    if (hash.includes("access_token") && hash.includes("type=recovery")) {
      // Let Supabase SDK parse the hash and establish the session
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setReady(true);
        } else {
          setStatus("invalid");
        }
      });
    } else {
      setStatus("invalid");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }

    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setStatus("idle");
    } else {
      setStatus("ok");
      setTimeout(() => router.push("/reservas"), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="p-6">
        <Link href="/">
          <Image src="/aco-logo.webp" alt="ACO Workspace" width={100} height={30} className="h-7 w-auto" />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {status === "invalid" && (
            <div className="text-center">
              <p className="text-neutral-700 font-medium mb-2">El link no es válido o ya expiró.</p>
              <p className="text-neutral-500 text-sm mb-6">Pedile a recepción que te envíe uno nuevo.</p>
              <Link href="/login" className="text-sm font-medium text-neutral-900 hover:underline">Volver al inicio</Link>
            </div>
          )}

          {status === "ok" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-neutral-900 font-semibold mb-1">¡Contraseña actualizada!</p>
              <p className="text-neutral-500 text-sm">Te redirigimos en un momento...</p>
            </div>
          )}

          {(ready || status === "idle") && status !== "ok" && status !== "invalid" && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900">Nueva contraseña</h1>
                <p className="text-neutral-500 text-sm mt-1">Elegí una contraseña para tu cuenta en ACO Workspace.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nueva contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Confirmá la contraseña</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repetí la contraseña"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 aco-gradient"
                >
                  {status === "loading" ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
