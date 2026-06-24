"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentMap } from "@/lib/site-content";

const SEDES = ["Palermo", "Monserrat"];

export default function Contact({ content = {} }: { content?: ContentMap }) {
  const image = content["contact.image"] || "";
  const imagePosition = content["contact.image_position"] || "50% 50%";
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    tipo: "",
    sedes: [] as string[],
    mensaje: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSede(sede: string) {
    setForm((f) => ({
      ...f,
      sedes: f.sedes.includes(sede)
        ? f.sedes.filter((s) => s !== sede)
        : [...f.sedes, sede],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/gracias");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const inputClass =
    "w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#C0201A] hover:border-neutral-400 transition";

  return (
    <section id="contacto-form" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Título encima del grid */}
        <div className="mb-12">
          <p className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">
            Contacto
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 leading-tight mb-4">
            {content["contact.title"] || "¿Querés saber más?"}
          </h2>
          <p className="text-neutral-500 text-lg leading-relaxed">
            {content["contact.subtitle"] || "Completá el formulario y te respondemos a la brevedad."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Foto — se estira para igualar la altura del form */}
          <div className="relative rounded-2xl overflow-hidden bg-neutral-100 min-h-64">
            {image ? (
              <img
                src={image}
                alt="ACO Workspace"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: imagePosition }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-neutral-300 text-sm">Foto — editable desde el back office</span>
              </div>
            )}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre</label>
              <input
                name="nombre"
                required
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="tu@mail.com"
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Teléfono</label>
              <input
                name="telefono"
                type="tel"
                placeholder="+54 9 11 0000-0000"
                value={form.telefono}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">¿Es para vos o para una empresa?</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Seleccioná una opción</option>
                <option value="Para mí">Para mí</option>
                <option value="Para una empresa">Para una empresa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">¿En qué sede estás interesado?</label>
              <div className="flex gap-3">
                {SEDES.map((sede) => {
                  const selected = form.sedes.includes(sede);
                  const isLima = sede === "Monserrat";
                  return (
                    <button
                      key={sede}
                      type="button"
                      onClick={() => handleSede(sede)}
                      className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
                      style={
                        selected
                          ? {
                              background: isLima ? "#dce5c8" : "#fee2e2",
                              color: isLima ? "#3d4e22" : "#991b1b",
                              borderColor: isLima ? "#627A38" : "#C0201A",
                            }
                          : { background: "white", color: "#737373", borderColor: "#e5e5e5" }
                      }
                    >
                      {sede}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mensaje</label>
              <textarea
                name="mensaje"
                required
                rows={4}
                placeholder="¿Qué necesitás?"
                value={form.mensaje}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || status === "ok"}
              className={`w-full rounded-full py-4 text-sm font-medium transition-opacity ${
                status === "ok"
                  ? "bg-green-600 text-white cursor-default"
                  : "aco-gradient text-white hover:opacity-90 disabled:opacity-60"
              }`}
            >
              {status === "loading" ? "Enviando..." : status === "ok" ? "¡Mensaje enviado!" : "Enviar mensaje"}
            </button>

            {status === "error" && (
              <p className="text-sm text-red-600 text-center">
                Hubo un error al enviar. Escribinos a info@acoworkspace.com.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
