"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/lib/types";
import RoomModal from "./RoomModal";

export default function SalasPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalRoom, setModalRoom] = useState<Room | "new" | null>(null);

  const load = async () => {
    const { data } = await supabase.from("rooms").select("*").order("created_at");
    setRooms((data as Room[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (room: Room) => {
    await supabase.from("rooms").update({ is_active: !room.is_active }).eq("id", room.id);
    setRooms((prev) => prev.map((r) => r.id === room.id ? { ...r, is_active: !r.is_active } : r));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sala?")) return;
    await supabase.from("rooms").delete().eq("id", id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const sedeColor = (sede: string) =>
    sede === "Monserrat"
      ? { background: "#dce5c8", color: "#3d4e22" }
      : { background: "#fee2e2", color: "#991b1b" };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Salas</h1>
          <p className="text-neutral-500 text-sm mt-1">{rooms.length} sala{rooms.length !== 1 ? "s" : ""} en total</p>
        </div>
        <button
          onClick={() => setModalRoom("new")}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
        >
          + Nueva sala
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-900 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-24 text-neutral-600">
          <p className="text-lg mb-2">No hay salas cargadas</p>
          <button
            onClick={() => setModalRoom("new")}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Crear la primera →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold">{room.name}</h3>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={sedeColor(room.sede)}>
                    {room.sede}
                  </span>
                  {!room.is_active && (
                    <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">Inactiva</span>
                  )}
                </div>
                <p className="text-neutral-500 text-sm truncate">{room.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-neutral-600">
                  <span>Cap. {room.capacity}</span>
                  {room.price_per_hour && <span>${room.price_per_hour}/h</span>}
                  {room.price_per_day && <span>${room.price_per_day}/día</span>}
                  <span>
                    {room.available_from} – {room.available_to}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(room)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    room.is_active
                      ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"
                  }`}
                >
                  {room.is_active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => setModalRoom(room)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-red-400 hover:bg-red-950 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalRoom !== null && (
        <RoomModal
          room={modalRoom === "new" ? null : modalRoom}
          onClose={() => setModalRoom(null)}
          onSave={() => { setModalRoom(null); load(); }}
        />
      )}
    </div>
  );
}
