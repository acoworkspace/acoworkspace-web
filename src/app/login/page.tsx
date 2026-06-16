"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/reservas";

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "forgot") {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      setForgotSent(true);
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) { setError("Email o contraseña incorrectos."); setLoading(false); return; }
    } else {
      if (!form.name.trim()) { setError("El nombre es requerido."); setLoading(false); return; }
      if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); setLoading(false); return; }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, full_name: form.name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al crear la cuenta."); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (error) { setError(error.message); setLoading(false); return; }
    }

    router.replace(redirect);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setForgotSent(false);
  };

  const titles: Record<Mode, string> = {
    login: "Ingresá a tu cuenta",
    register: "Creá tu cuenta",
    forgot: "Olvidé mi contraseña",
  };
  const subtitles: Record<Mode, string> = {
    login: "Para reservar salas en ACO Workspace",
    register: "Empezá a reservar en ACO Workspace",
    forgot: "Te mandamos un link para resetear tu contraseña.",
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{titles[mode]}</h1>
        <p className="text-neutral-500 text-sm mt-1">{subtitles[mode]}</p>
      </div>

      {forgotSent ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-neutral-800 font-medium mb-1">¡Listo! Revisá tu mail.</p>
          <p className="text-neutral-500 text-sm mb-6">Si el email existe, te llega el link en unos segundos.</p>
          <button onClick={() => switchMode("login")} className="text-sm font-medium text-neutral-900 hover:underline">
            Volver al inicio de sesión
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  placeholder="Tu nombre"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                placeholder="tu@email.com"
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Contraseña</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : ""}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 aco-gradient"
            >
              {loading ? "..." : mode === "login" ? "Ingresar" : mode === "register" ? "Crear cuenta" : "Enviar link"}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            {mode === "forgot" ? (
              <>
                {"¿Ya recordaste tu contraseña? "}
                <button onClick={() => switchMode("login")} className="font-medium text-neutral-900 hover:underline">
                  Ingresá
                </button>
              </>
            ) : (
              <>
                {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
                <button
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="font-medium text-neutral-900 hover:underline"
                >
                  {mode === "login" ? "Registrate" : "Ingresá"}
                </button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <div className="p-6">
        <Link href="/">
          <Image src="/aco-logo.webp" alt="ACO Workspace" width={100} height={30} className="h-7 w-auto" />
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
