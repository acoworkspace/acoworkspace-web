"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/lib/types";

type Step = "buscar" | "sala" | "confirmar";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtPoints(p: number) { return parseFloat(p.toFixed(2)); }
function calcPoints(startT: string, endT: string, pph: number) {
  return Math.round((timeToMinutes(endT) - timeToMinutes(startT)) / 60 * pph * 2) / 2;
}

// Generate 30-min slots from 07:00 to 23:00
function timeSlots() {
  const slots: string[] = [];
  for (let h = 7; h <= 23; h++) {
    slots.push(`${pad(h)}:00`);
    if (h < 23) slots.push(`${pad(h)}:30`);
  }
  return slots;
}
const ALL_SLOTS = timeSlots();

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function formatDuration(start: string, end: string) {
  const mins = timeToMinutes(end) - timeToMinutes(start);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const sedeStyle = (sede: string) =>
  sede === "Monserrat"
    ? { background: "#dce5c8", color: "#3d4e22" }
    : { background: "#fee2e2", color: "#991b1b" };

export default function ReservasPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("buscar");
  const [userSession, setUserSession] = useState<{ id: string; token: string; name: string | null; email: string | null } | null>(null);
  const [acoPoints, setAcoPoints] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login?redirect=/reservas");
        return;
      }
      setUserSession({ id: session.user.id, token: session.access_token, name: session.user.user_metadata?.full_name ?? null, email: session.user.email ?? null });
      const { data: profile } = await supabase.from("profiles").select("aco_points, status").eq("id", session.user.id).single();
      if (!profile || profile.status !== "approved") {
        setAuthLoading(false);
        return; // show pending screen
      }
      setAcoPoints(profile.aco_points ?? 0);
      setAuthLoading(false);
    });
  }, [router]);

  // Date picker state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  // Search results
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  // Selected room
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Confirmation form
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Calendar helpers
  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Last day of next month
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  maxDate.setHours(0, 0, 0, 0);
  const canGoNext = new Date(calYear, calMonth + 1, 1) <= maxDate;

  const endSlots = ALL_SLOTS.filter(
    (t) => timeToMinutes(t) > timeToMinutes(startTime)
  );

  // Ensure endTime is always after startTime
  const handleStartChange = (val: string) => {
    setStartTime(val);
    if (timeToMinutes(endTime) <= timeToMinutes(val)) {
      const nextIdx = ALL_SLOTS.indexOf(val) + 1;
      setEndTime(ALL_SLOTS[nextIdx] ?? "23:30");
    }
  };

  const handleSearch = async () => {
    if (!selectedDate) return;
    setSearching(true);
    setSearched(false);

    const dateStr = `${calYear}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
    // Use -03:00 for Argentina timezone
    const start = `${dateStr}T${startTime}:00-03:00`;
    const end = `${dateStr}T${endTime}:00-03:00`;

    const res = await fetch(`/api/rooms/search?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    const data = await res.json();
    setAvailableRooms(data.rooms ?? []);
    setSearched(true);
    setSearching(false);
    setStep("sala");
  };

  const handleBook = async () => {
    if (!selectedRoom || !selectedDate) return;
    if (!form.name || !form.email) { setError("Nombre y email son requeridos."); return; }
    setError("");
    setSubmitting(true);

    const dateStr = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
    const start = `${dateStr}T${startTime}:00-03:00`;
    const end = `${dateStr}T${endTime}:00-03:00`;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userSession?.token ? { "Authorization": `Bearer ${userSession.token}` } : {}),
      },
      body: JSON.stringify({
        room_id: selectedRoom.id,
        guest_name: form.name,
        guest_email: form.email,
        start_time: start,
        end_time: end,
        notes: form.notes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear la reserva.");
      setSubmitting(false);
    } else {
      setSuccess(true);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
      </div>
    );
  }

  // Approved is null means user exists but not yet approved
  if (userSession && acoPoints === null) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Cuenta pendiente de aprobación</h1>
        <p className="text-neutral-500 text-sm max-w-xs">
          Tu cuenta está siendo revisada por el equipo de ACO Workspace. Te avisamos cuando esté lista.
        </p>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}
          className="mt-8 text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (success && selectedRoom && selectedDate) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">¡Reserva confirmada!</h1>
          <p className="text-neutral-600 mb-1 font-medium">{selectedRoom.name} · {selectedRoom.sede}</p>
          <p className="text-neutral-500 mb-1">
            {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-neutral-500 mb-8">{startTime} – {endTime} hs · {formatDuration(startTime, endTime)}</p>
          <p className="text-neutral-400 text-sm mb-8">Confirmación enviada a <strong>{form.email}</strong></p>
          <Link href="/" className="aco-gradient text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/aco-logo.webp" alt="ACO Workspace" width={100} height={30} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            {acoPoints !== null && (
              <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-neutral-900">{fmtPoints(acoPoints)}</span>
                <span className="text-xs text-neutral-500">ACO Points</span>
              </div>
            )}
            {userSession?.name && (
              <span className="text-sm text-neutral-500 hidden sm:block">{userSession.name}</span>
            )}
            {userSession && (
              <button
                onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}
                className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                Salir
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {(["buscar", "sala", "confirmar"] as Step[]).map((s, i) => {
              const labels = { buscar: "Cuándo", sala: "Espacio", confirmar: "Confirmar" };
              const past = (step === "sala" && s === "buscar") || (step === "confirmar" && s !== "confirmar");
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 ${step === s ? "text-neutral-900 font-medium" : past ? "text-neutral-400" : "text-neutral-300"}`}>
                    <span
                      className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium"
                      style={step === s ? { background: "linear-gradient(135deg, #C0201A, #E03A1A)", color: "white" } : { background: past ? "#e5e5e5" : "#f5f5f5", color: past ? "#737373" : "#d4d4d4" }}
                    >
                      {past ? "✓" : i + 1}
                    </span>
                    <span className="hidden sm:block">{labels[s]}</span>
                  </div>
                  {i < 2 && <span className="text-neutral-200">›</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* STEP 1: Buscar */}
        {step === "buscar" && (
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">¿Cuándo necesitás el espacio?</h1>
            <p className="text-neutral-500 mb-8">Elegí el día y horario de tu reunión y te mostramos qué hay disponible.</p>

            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
              {/* Calendar */}
              <div className="p-6 border-b border-neutral-100">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1, 1))} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 text-lg leading-none">‹</button>
                  <span className="font-semibold text-neutral-900">{MONTH_NAMES[calMonth]} {calYear}</span>
                  <button onClick={() => canGoNext && setCalendarDate(new Date(calYear, calMonth + 1, 1))} disabled={!canGoNext} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-500 text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const date = new Date(calYear, calMonth, day);
                    const isPast = date < today;
                    const isBeyondMax = date > maxDate;
                    const isDisabled = isPast || isBeyondMax;
                    const isSel = selectedDate?.getDate() === day && selectedDate?.getMonth() === calMonth && selectedDate?.getFullYear() === calYear;
                    return (
                      <button
                        key={day}
                        onClick={() => !isDisabled && setSelectedDate(date)}
                        disabled={isDisabled}
                        className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-colors font-medium ${
                          isSel ? "text-white" : isDisabled ? "text-neutral-300 cursor-not-allowed" : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                        style={isSel ? { background: "linear-gradient(135deg, #C0201A, #E03A1A)" } : {}}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time selectors */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Desde</label>
                    <select
                      value={startTime}
                      onChange={(e) => handleStartChange(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white appearance-none cursor-pointer"
                    >
                      {ALL_SLOTS.slice(0, -1).map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Hasta</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white appearance-none cursor-pointer"
                    >
                      {endSlots.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDate && (
                  <div className="bg-neutral-50 rounded-xl px-4 py-3 mb-6 text-sm text-neutral-600">
                    <span className="font-medium text-neutral-900">
                      {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    {" · "}{startTime} – {endTime} hs · <span className="text-neutral-400">{formatDuration(startTime, endTime)}</span>
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={!selectedDate || searching}
                  className="w-full py-3.5 rounded-full text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 aco-gradient"
                >
                  {searching ? "Buscando..." : "Ver espacios disponibles"}
                </button>
                {!selectedDate && (
                  <p className="text-center text-xs text-neutral-400 mt-3">Seleccioná un día para continuar</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Elegir sala */}
        {step === "sala" && selectedDate && (
          <div>
            <button onClick={() => { setStep("buscar"); setSearched(false); }} className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors mb-6 text-sm">
              ← Cambiar horario
            </button>

            <div className="flex items-baseline gap-3 mb-2">
              <h1 className="text-2xl font-bold text-neutral-900">Espacios disponibles</h1>
            </div>
            <p className="text-neutral-500 mb-6">
              {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              {" · "}<span className="font-medium text-neutral-700">{startTime} – {endTime} hs</span>
              {" · "}{formatDuration(startTime, endTime)}
            </p>

            {availableRooms.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center">
                <p className="text-neutral-500 text-lg mb-2">No hay espacios disponibles</p>
                <p className="text-neutral-400 text-sm mb-6">Todos los espacios están ocupados en ese horario.</p>
                <button
                  onClick={() => setStep("buscar")}
                  className="aco-gradient text-white px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Probar otro horario
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => { setSelectedRoom(room); setStep("confirmar"); setForm(f => ({ ...f, name: f.name || userSession?.name || "", email: f.email || userSession?.email || "" })); }}
                    className="text-left bg-white border border-neutral-200 rounded-2xl p-6 transition-all hover:shadow-md"
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #C0201A")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                  >
                    {room.image_url && (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 -mt-1">
                        <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={sedeStyle(room.sede)}>
                        {room.sede}
                      </span>
                      <span className="text-neutral-400 text-xs">{room.capacity} personas</span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{room.name}</h3>
                    <p className="text-neutral-500 text-sm mb-4 leading-relaxed line-clamp-2">{room.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">+{room.amenities.length - 3}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Disponible ✓</span>
                      <span className="font-semibold text-neutral-800 text-sm">
                        {calcPoints(startTime, endTime, room.points_per_hour ?? 1)} pts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Confirmar */}
        {step === "confirmar" && selectedRoom && selectedDate && (
          <div className="max-w-lg">
            <button onClick={() => setStep("sala")} className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition-colors mb-6 text-sm">
              ← Elegir otro espacio
            </button>
            <h1 className="text-2xl font-bold text-neutral-900 mb-8">Confirmá tu reserva</h1>

            {/* Summary */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden mb-6">
              {selectedRoom.image_url && (
                <div className="relative w-full h-44">
                  <img src={selectedRoom.image_url} alt={selectedRoom.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={sedeStyle(selectedRoom.sede)}>
                  {selectedRoom.sede}
                </span>
              </div>
              <h3 className="font-bold text-neutral-900 text-lg mb-4">{selectedRoom.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Fecha</span>
                  <span className="font-medium text-neutral-900">
                    {selectedDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Horario</span>
                  <span className="font-medium text-neutral-900">{startTime} – {endTime} hs · {formatDuration(startTime, endTime)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-2 mt-2">
                  <span className="font-semibold text-neutral-900">ACO Points a descontar</span>
                  <span className="font-bold text-neutral-900">
                    {calcPoints(startTime, endTime, selectedRoom.points_per_hour ?? 1)} pts
                  </span>
                </div>
                {acoPoints !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Tu saldo actual</span>
                    <span className={acoPoints < calcPoints(startTime, endTime, selectedRoom.points_per_hour ?? 1) ? "text-red-500 font-medium" : "text-neutral-600"}>
                      {fmtPoints(acoPoints)} pts
                    </span>
                  </div>
                )}
              </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre completo *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 bg-white h-24 resize-none"
                  placeholder="Cantidad de personas, equipamiento necesario, etc."
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleBook}
                disabled={submitting}
                className="w-full py-4 rounded-full text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 aco-gradient"
              >
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </button>
              <p className="text-xs text-neutral-400 text-center">
                Al confirmar aceptás nuestros términos de uso.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
