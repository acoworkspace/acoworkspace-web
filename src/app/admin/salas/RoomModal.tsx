"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Room, Sede } from "@/lib/types";

interface GCalendar {
  id: string;
  summary: string;
  backgroundColor: string | null | undefined;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface Props {
  room: Room | null;
  onClose: () => void;
  onSave: () => void;
}

export default function RoomModal({ room, onClose, onSave }: Props) {
  const [calendars, setCalendars] = useState<GCalendar[]>([]);
  const [calLoading, setCalLoading] = useState(true);
  const [creatingCal, setCreatingCal] = useState(false);
  const [form, setForm] = useState({
    name: room?.name ?? "",
    description: room?.description ?? "",
    sede: (room?.sede ?? "Palermo") as Sede,
    capacity: room?.capacity ?? 1,
    price_per_hour: room?.price_per_hour ?? "",
    price_per_day: room?.price_per_day ?? "",
    points_per_hour: room?.points_per_hour ?? 1,
    amenities: room?.amenities?.join("\n") ?? "",
    available_days: room?.available_days ?? [1, 2, 3, 4, 5],
    available_from: room?.available_from ?? "09:00",
    available_to: room?.available_to ?? "20:00",
    is_active: room?.is_active ?? true,
    google_calendar_id: room?.google_calendar_id ?? "",
    image_url: room?.image_url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/calendar/list")
      .then((r) => r.json())
      .then(({ calendars }) => setCalendars(calendars ?? []))
      .catch(() => {})
      .finally(() => setCalLoading(false));
  }, []);

  const handleCreateCalendar = async () => {
    if (!form.name.trim()) { setError("Guardá la sala primero con un nombre."); return; }
    if (!room) { setError("Guardá la sala primero, después asignale un calendario."); return; }
    setCreatingCal(true);
    const res = await fetch("/api/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: room.id, room_name: form.name }),
    });
    const data = await res.json();
    if (data.ok) {
      setForm((f) => ({ ...f, google_calendar_id: data.calendarId }));
      setCalendars((prev) => [...prev, { id: data.calendarId, summary: data.summary, backgroundColor: null }]);
    }
    setCreatingCal(false);
  };

  const toggleDay = (day: number) => {
    setForm((f) => ({
      ...f,
      available_days: f.available_days.includes(day)
        ? f.available_days.filter((d) => d !== day)
        : [...f.available_days, day].sort(),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `rooms/${room?.id ?? "new"}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    setForm((f) => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      sede: form.sede,
      capacity: Number(form.capacity),
      price_per_hour: form.price_per_hour !== "" ? Number(form.price_per_hour) : null,
      price_per_day: form.price_per_day !== "" ? Number(form.price_per_day) : null,
      points_per_hour: Number(form.points_per_hour),
      amenities: form.amenities.split("\n").map((s) => s.trim()).filter(Boolean),
      available_days: form.available_days,
      available_from: form.available_from,
      available_to: form.available_to,
      is_active: form.is_active,
      google_calendar_id: form.google_calendar_id || null,
      image_url: form.image_url || null,
    };

    const { error } = room
      ? await supabase.from("rooms").update(payload).eq("id", room.id)
      : await supabase.from("rooms").insert(payload);

    if (error) {
      setError(error.message);
      setSaving(false);
    } else {
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between sticky top-0 bg-neutral-900">
          <h2 className="text-white font-semibold">{room ? "Editar sala" : "Nueva sala"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sala de reuniones A" />
            </div>

            <div>
              <label className="label">Sede</label>
              <select className="input" value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value as Sede })}>
                <option>Palermo</option>
                <option>Monserrat</option>
              </select>
            </div>

            <div>
              <label className="label">Capacidad</label>
              <input className="input" type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>

            <div>
              <label className="label">Precio / hora (ARS)</label>
              <input className="input" type="number" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })} placeholder="Opcional" />
            </div>

            <div>
              <label className="label">Precio / día (ARS)</label>
              <input className="input" type="number" value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} placeholder="Opcional" />
            </div>

            <div>
              <label className="label">ACO Points / hora</label>
              <input className="input" type="number" min={0} value={form.points_per_hour} onChange={(e) => setForm({ ...form, points_per_hour: Number(e.target.value) })} />
            </div>

            <div>
              <label className="label">Desde</label>
              <input className="input" type="time" value={form.available_from} onChange={(e) => setForm({ ...form, available_from: e.target.value })} />
            </div>

            <div>
              <label className="label">Hasta</label>
              <input className="input" type="time" value={form.available_to} onChange={(e) => setForm({ ...form, available_to: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea className="input h-20 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">Amenities (una por línea)</label>
            <textarea className="input h-28 resize-none font-mono text-xs" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} placeholder={"WiFi de alta velocidad\nAire acondicionado\nProyector"} />
          </div>

          <div>
            <label className="label">Días disponibles</label>
            <div className="flex gap-2 mt-1">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.available_days.includes(i)
                      ? "text-white"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                  style={form.available_days.includes(i) ? { background: "linear-gradient(135deg, #C0201A, #E03A1A)" } : {}}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="label">Foto de la sala</label>
            <div
              className="border border-dashed border-neutral-700 rounded-xl overflow-hidden cursor-pointer hover:border-neutral-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {form.image_url ? (
                <div className="relative w-full h-40">
                  <Image src={form.image_url} alt="Sala" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">Cambiar foto</span>
                  </div>
                </div>
              ) : (
                <div className="h-24 flex flex-col items-center justify-center text-neutral-500 text-sm gap-1">
                  <span className="text-2xl">+</span>
                  <span>{uploading ? "Subiendo..." : "Subir foto"}</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Google Calendar */}
          <div>
            <label className="label">Google Calendar</label>
            {calLoading ? (
              <div className="input text-neutral-500">Cargando calendarios...</div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={form.google_calendar_id}
                  onChange={(e) => setForm({ ...form, google_calendar_id: e.target.value })}
                >
                  <option value="">— Sin calendario asignado —</option>
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id ?? ""}>{c.summary}</option>
                  ))}
                </select>
                {room && (
                  <button
                    type="button"
                    onClick={handleCreateCalendar}
                    disabled={creatingCal}
                    className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs hover:bg-neutral-700 transition-colors whitespace-nowrap disabled:opacity-50"
                    title="Crear nuevo calendario con el nombre de la sala"
                  >
                    {creatingCal ? "Creando..." : "+ Nuevo"}
                  </button>
                )}
              </div>
            )}
            <p className="text-neutral-600 text-xs mt-1">Las reservas de esta sala se agregarán a este calendario.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? "" : "bg-neutral-700"}`}
              style={form.is_active ? { background: "linear-gradient(135deg, #C0201A, #E03A1A)" } : {}}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
            </button>
            <span className="text-sm text-neutral-400">Sala activa (visible para reservas)</span>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="p-6 border-t border-neutral-800 flex gap-3 sticky bottom-0 bg-neutral-900">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
          >
            {saving ? "Guardando..." : room ? "Guardar cambios" : "Crear sala"}
          </button>
        </div>
      </div>

      <style>{`
        .label { display: block; color: #a3a3a3; font-size: 0.8rem; margin-bottom: 0.375rem; }
        .input { width: 100%; background: #171717; border: 1px solid #404040; color: #fff; border-radius: 0.5rem; padding: 0.625rem 0.875rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: #737373; }
        select.input option { background: #171717; }
        .left-5\\.5 { left: 1.375rem; }
      `}</style>
    </div>
  );
}
