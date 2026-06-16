"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Booking } from "@/lib/types";

type Filter = "upcoming" | "today" | "all";

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [search, setSearch] = useState("");

  const load = async (f: Filter) => {
    setLoading(true);
    let query = supabase
      .from("bookings")
      .select("*, room:rooms(name, sede)")
      .order("start_time", { ascending: f !== "all" });

    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    if (f === "upcoming") query = query.gte("start_time", now.toISOString());
    if (f === "today") {
      query = query
        .gte("start_time", today.toISOString())
        .lt("start_time", tomorrow.toISOString());
    }
    if (f === "all") query = query.order("start_time", { ascending: false });

    const { data } = await query.limit(100);
    setBookings((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [filter]);

  const cancelBooking = async (id: string) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: id }),
    });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" } : b));
  };

  const statusBadge = (status: string) => {
    if (status === "confirmed") return { label: "Confirmada", bg: "#14532d", color: "#86efac" };
    if (status === "cancelled") return { label: "Cancelada", bg: "#450a0a", color: "#fca5a5" };
    return { label: "Pendiente", bg: "#451a03", color: "#fdba74" };
  };

  const sedeColor = (sede: string) =>
    sede === "Monserrat"
      ? { background: "#dce5c8", color: "#3d4e22" }
      : { background: "#fee2e2", color: "#991b1b" };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="text-neutral-500 text-sm mt-1">{bookings.length} reservas</p>
        </div>

        <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          {(["upcoming", "today", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {f === "upcoming" ? "Próximas" : f === "today" ? "Hoy" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o sala..."
          className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600 placeholder-neutral-600"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 text-neutral-600">No hay reservas para mostrar</div>
      ) : (
        <div className="space-y-3">
          {(search.trim()
            ? bookings.filter((b) => {
                const q = search.toLowerCase();
                const room = b.room as { name: string; sede: string } | null;
                return (
                  (b.guest_name ?? "").toLowerCase().includes(q) ||
                  (b.guest_email ?? "").toLowerCase().includes(q) ||
                  (room?.name ?? "").toLowerCase().includes(q) ||
                  (room?.sede ?? "").toLowerCase().includes(q)
                );
              })
            : bookings
          ).map((b) => {
            const badge = statusBadge(b.status);
            const room = b.room as { name: string; sede: string } | null;
            return (
              <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-medium">{b.guest_name || b.guest_email || "Sin nombre"}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {b.google_event_id && (
                      <span className="text-xs text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-full">Google Cal</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-500">
                    {room && (
                      <>
                        <span>{room.name}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={sedeColor(room.sede)}>
                          {room.sede}
                        </span>
                      </>
                    )}
                  </div>
                  {b.guest_email && b.guest_name && (
                    <p className="text-neutral-600 text-xs mt-1">{b.guest_email}</p>
                  )}
                  {b.notes && <p className="text-neutral-600 text-xs mt-1 italic">{b.notes}</p>}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-neutral-300 text-sm font-medium">
                    {new Date(b.start_time).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    {new Date(b.start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(b.end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => cancelBooking(b.id)}
                      className="mt-2 text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
