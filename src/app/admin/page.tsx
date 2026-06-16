"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Stats {
  rooms: number;
  activeRooms: number;
  bookingsToday: number;
  bookingsMonth: number;
  upcomingBookings: Array<{
    id: string;
    guest_name: string | null;
    guest_email: string | null;
    start_time: string;
    end_time: string;
    room: { name: string; sede: string } | null;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [
        { count: rooms },
        { count: activeRooms },
        { count: bookingsToday },
        { count: bookingsMonth },
        { data: upcoming },
      ] = await Promise.all([
        supabase.from("rooms").select("*", { count: "exact", head: true }),
        supabase.from("rooms").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .gte("start_time", today.toISOString())
          .lt("start_time", tomorrow.toISOString())
          .eq("status", "confirmed"),
        supabase.from("bookings").select("*", { count: "exact", head: true })
          .gte("start_time", monthStart.toISOString())
          .lte("start_time", monthEnd.toISOString())
          .eq("status", "confirmed"),
        supabase.from("bookings")
          .select("id, guest_name, guest_email, start_time, end_time, room:rooms(name, sede)")
          .gte("start_time", new Date().toISOString())
          .eq("status", "confirmed")
          .order("start_time", { ascending: true })
          .limit(5),
      ]);

      setStats({
        rooms: rooms ?? 0,
        activeRooms: activeRooms ?? 0,
        bookingsToday: bookingsToday ?? 0,
        bookingsMonth: bookingsMonth ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upcomingBookings: (upcoming ?? []) as unknown as Stats["upcomingBookings"],
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "Reservas hoy", value: stats.bookingsToday, href: "/admin/reservas" },
        { label: "Reservas este mes", value: stats.bookingsMonth, href: "/admin/reservas" },
        { label: "Salas activas", value: `${stats.activeRooms} / ${stats.rooms}`, href: "/admin/salas" },
      ]
    : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">Resumen de ACO Workspace</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats === null
          ? [1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-neutral-800 rounded w-1/2 mb-3" />
                <div className="h-8 bg-neutral-800 rounded w-1/3" />
              </div>
            ))
          : cards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-600 transition-colors"
              >
                <p className="text-neutral-500 text-sm mb-2">{card.label}</p>
                <p className="text-white text-3xl font-bold">{card.value}</p>
              </Link>
            ))}
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Próximas reservas</h2>
          <Link href="/admin/reservas" className="text-neutral-400 text-sm hover:text-white transition-colors">
            Ver todas →
          </Link>
        </div>

        {stats === null ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse" />
            ))}
          </div>
        ) : stats.upcomingBookings.length === 0 ? (
          <div className="p-12 text-center text-neutral-600">No hay reservas próximas</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {stats.upcomingBookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{b.guest_name || b.guest_email || "Sin nombre"}</p>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    {b.room?.name} · {b.room?.sede}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-neutral-300 text-sm">
                    {new Date(b.start_time).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    {new Date(b.start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(b.end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
