"use client";

import { useEffect, useState } from "react";

interface Client {
  id: string;
  full_name: string | null;
  company: string | null;
  aco_points: number;
  monthly_points: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  email: string;
  total_given: number;
  total_spent: number;
  monthly_avg: number;
}

type Filter = "pending" | "approved" | "all";

const STATUS_LABEL = {
  pending:  { label: "Pendiente", bg: "#451a03", color: "#fdba74" },
  approved: { label: "Aprobado",  bg: "#14532d", color: "#86efac" },
  rejected: { label: "Rechazado", bg: "#450a0a", color: "#fca5a5" },
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");

  // Points editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Monthly points config editing
  const [editingMonthlyId, setEditingMonthlyId] = useState<string | null>(null);
  const [monthlyInput, setMonthlyInput] = useState("");

  // Bulk recharge
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [recharging, setRecharging] = useState(false);
  const [rechargeMsg, setRechargeMsg] = useState("");

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  // Confirm delete
  const [confirmClient, setConfirmClient] = useState<Client | null>(null);

  // Reset password
  const [resetSending, setResetSending] = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({});

  const handleResetPassword = async (client: Client) => {
    setResetSending(client.id);
    const res = await fetch("/api/admin/clients/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: client.email, name: client.full_name }),
    });
    setResetSending(null);
    setResetMsg((prev) => ({ ...prev, [client.id]: res.ok ? "✓ Mail enviado" : "Error al enviar" }));
    setTimeout(() => setResetMsg((prev) => { const n = { ...prev }; delete n[client.id]; return n; }), 4000);
  };

  const load = async () => {
    const res = await fetch("/api/admin/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (client: Client, status: "approved" | "rejected") => {
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, status } : c));
    await fetch("/api/admin/clients/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: client.id, status }),
    });
  };

  const handleAddPoints = async (client: Client) => {
    const delta = parseInt(pointsInput);
    if (isNaN(delta) || delta === 0) return;
    setSaving(true);
    await fetch("/api/admin/clients/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: client.id, delta, description: "Carga manual por staff" }),
    });
    setClients((prev) => prev.map((c) =>
      c.id === client.id ? { ...c, aco_points: c.aco_points + delta, total_given: delta > 0 ? c.total_given + delta : c.total_given } : c
    ));
    setEditingId(null);
    setPointsInput("");
    setSaving(false);
  };

  const handleSaveMonthly = async (client: Client) => {
    const val = parseInt(monthlyInput);
    if (isNaN(val) || val < 0) return;
    const admin = await fetch("/api/admin/clients/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: client.id, monthly_points: val }),
    });
    if (admin.ok) {
      setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, monthly_points: val } : c));
    }
    setEditingMonthlyId(null);
    setMonthlyInput("");
  };

  const handleRecharge = async (useMonthly: boolean, userIds?: string[]) => {
    setRecharging(true);
    setRechargeMsg("");
    const amount = parseInt(rechargeAmount);
    const res = await fetch("/api/admin/clients/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_ids: userIds ?? (selectedIds.size > 0 ? Array.from(selectedIds) : null),
        amount: useMonthly ? null : amount,
        use_monthly: useMonthly,
      }),
    });
    const data = await res.json();
    setRechargeMsg(`✓ ${data.recharged} usuario${data.recharged !== 1 ? "s" : ""} recargado${data.recharged !== 1 ? "s" : ""}`);
    setRecharging(false);
    setSelectedIds(new Set());
    await load();
    setTimeout(() => setRechargeMsg(""), 4000);
  };

  const approvedClients = clients.filter((c) => c.status === "approved");
  const searched = search.trim()
    ? clients.filter((c) =>
        (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.company ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : clients;
  const filtered = filter === "all" ? searched : searched.filter((c) => c.status === filter);
  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const allApprovedSelected = approvedClients.length > 0 && approvedClients.every((c) => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allApprovedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(approvedClients.map((c) => c.id)));
    }
  };

  const handleDelete = async (client: Client) => {
    await fetch("/api/admin/clients/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: client.id, status: "rejected" }),
    });
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, status: "rejected" } : c));
    setConfirmClient(null);
  };

  return (
    <div className="p-8">
      {/* Confirm modal */}
      {confirmClient && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-2">¿Eliminar cliente?</h3>
            <p className="text-neutral-400 text-sm mb-1">Vas a eliminar el acceso de <strong className="text-white">{confirmClient.full_name || confirmClient.email}</strong>.</p>
            <p className="text-red-400 text-xs mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClient(null)} className="flex-1 py-2.5 rounded-lg bg-neutral-800 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmClient)} className="flex-1 py-2.5 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-neutral-500 text-sm mt-1">{clients.length} registrado{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
          {(["pending", "approved", "all"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${filter === f ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
              {f === "pending" ? "Pendientes" : f === "approved" ? "Aprobados" : "Todos"}
              {f === "pending" && pendingCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o empresa..."
          className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-neutral-600 placeholder-neutral-600"
        />
      </div>

      {/* Bulk recharge toolbar — only on approved tab */}
      {filter === "approved" && approvedClients.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={allApprovedSelected} onChange={toggleSelectAll}
              className="accent-red-600 w-4 h-4 cursor-pointer" />
            Seleccionar todos
          </label>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {rechargeMsg && <span className="text-green-400 text-sm">{rechargeMsg}</span>}

            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="Puntos a cargar"
              className="w-36 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-neutral-500"
            />
            <button
              onClick={() => handleRecharge(false)}
              disabled={recharging || !rechargeAmount}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-neutral-700 text-white hover:bg-neutral-600 disabled:opacity-40 transition-colors"
            >
              {selectedIds.size > 0 ? `Cargar a ${selectedIds.size} seleccionados` : "Cargar a todos"}
            </button>
            <button
              onClick={() => handleRecharge(true)}
              disabled={recharging}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
              title="Carga a cada usuario su cuota mensual configurada"
            >
              Recarga mensual
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-neutral-900 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-neutral-600">
          {filter === "pending" ? "No hay clientes pendientes de aprobación" : "No hay clientes"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const badge = STATUS_LABEL[client.status];
            const isExpanded = expandedId === client.id;
            const isSelected = selectedIds.has(client.id);

            return (
              <div key={client.id} className={`bg-neutral-900 border rounded-xl overflow-hidden transition-colors ${isSelected ? "border-red-800" : "border-neutral-800"}`}>
                {/* Main row */}
                <div className="p-5 flex items-center gap-4">
                  {client.status === "approved" && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(client.id)}
                      className="accent-red-600 w-4 h-4 cursor-pointer shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <p className="text-white font-medium">{client.full_name || "Sin nombre"}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                    <p className="text-neutral-500 text-sm">{client.email}</p>
                    <p className="text-neutral-700 text-xs mt-0.5">
                      Desde {new Date(client.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  {/* Stats (approved only) */}
                  {client.status === "approved" && (
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                      {/* Saldo — destacado */}
                      <div className="flex flex-col items-center justify-center rounded-xl px-5 py-2.5 min-w-[80px]"
                        style={{ background: "linear-gradient(135deg, #C0201A22, #E03A1A11)", border: "1px solid #C0201A44" }}>
                        <div className="text-white font-bold text-xl leading-none">{client.aco_points}</div>
                        <div className="text-xs mt-1 font-medium" style={{ color: "#E03A1A" }}>Saldo</div>
                      </div>

                      {/* Separador */}
                      <div className="w-px h-8 bg-neutral-800" />

                      {/* Métricas secundarias */}
                      <div className="flex items-center gap-5 text-center">
                        <div>
                          <div className="text-neutral-400 font-medium text-sm">{client.total_given}</div>
                          <div className="text-neutral-600 text-xs mt-0.5">Cargados</div>
                        </div>
                        <div>
                          <div className="text-neutral-400 font-medium text-sm">{client.total_spent}</div>
                          <div className="text-neutral-600 text-xs mt-0.5">Gastados</div>
                        </div>
                        <div>
                          <div className="text-neutral-400 font-medium text-sm">{client.monthly_avg}</div>
                          <div className="text-neutral-600 text-xs mt-0.5">Prom/mes</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {client.status === "pending" && (
                      <>
                        <button onClick={() => handleApprove(client, "approved")}
                          className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                          Aprobar
                        </button>
                        <button onClick={() => handleApprove(client, "rejected")}
                          className="px-4 py-2 rounded-lg text-xs bg-neutral-800 text-red-400 hover:bg-red-950 transition-colors">
                          Rechazar
                        </button>
                      </>
                    )}

                    {client.status === "approved" && (
                      <>
                        <button onClick={() => setExpandedId(isExpanded ? null : client.id)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                          {isExpanded ? "Cerrar" : "Gestionar"}
                        </button>
                        <button onClick={() => setConfirmClient(client)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-600 hover:text-red-400 hover:bg-red-950 transition-colors">
                          Eliminar
                        </button>
                      </>
                    )}

                    {client.status === "rejected" && (
                      <button onClick={() => handleApprove(client, "approved")}
                        className="px-3 py-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && client.status === "approved" && (
                  <div className="border-t border-neutral-800 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-950">
                    {/* Stats mobile */}
                    <div className="md:hidden flex gap-6 text-center">
                      {[
                        { label: "Saldo", val: client.aco_points },
                        { label: "Cargados", val: client.total_given },
                        { label: "Gastados", val: client.total_spent },
                        { label: "Prom/mes", val: client.monthly_avg },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="text-white font-bold text-lg">{s.val}</div>
                          <div className="text-neutral-500 text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Add points */}
                    <div>
                      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-3">Asignar puntos</p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editingId === client.id ? pointsInput : ""}
                          onFocus={() => setEditingId(client.id)}
                          onChange={(e) => setPointsInput(e.target.value)}
                          placeholder="+10 ó -5"
                          className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                          onKeyDown={(e) => e.key === "Enter" && handleAddPoints(client)}
                        />
                        <button onClick={() => handleAddPoints(client)} disabled={saving}
                          className="px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}>
                          {saving ? "..." : "Aplicar"}
                        </button>
                      </div>
                    </div>

                    {/* Reset password */}
                    <div className="md:col-span-2">
                      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-3">Contraseña</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleResetPassword(client)}
                          disabled={resetSending === client.id}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                        >
                          {resetSending === client.id ? "Enviando..." : "Enviar mail de reseteo"}
                        </button>
                        {resetMsg[client.id] && (
                          <span className={`text-xs ${resetMsg[client.id].startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                            {resetMsg[client.id]}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-600 text-xs mt-1.5">Le llega un link a {client.email} para que defina una nueva contraseña.</p>
                    </div>

                    {/* Monthly quota */}
                    <div>
                      <p className="text-neutral-400 text-xs uppercase tracking-widest mb-3">Cuota mensual</p>
                      <div className="flex gap-2 items-center">
                        {editingMonthlyId === client.id ? (
                          <>
                            <input
                              type="number"
                              value={monthlyInput}
                              onChange={(e) => setMonthlyInput(e.target.value)}
                              placeholder="Puntos por mes"
                              className="flex-1 bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neutral-500"
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleSaveMonthly(client)}
                            />
                            <button onClick={() => handleSaveMonthly(client)}
                              className="px-4 py-2 rounded-lg text-xs font-medium text-white"
                              style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}>
                              Guardar
                            </button>
                            <button onClick={() => { setEditingMonthlyId(null); setMonthlyInput(""); }}
                              className="px-3 py-2 rounded-lg text-xs bg-neutral-800 text-neutral-400">✕</button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 bg-neutral-800 rounded-lg px-3 py-2 text-sm text-white">
                              {client.monthly_points > 0 ? `${client.monthly_points} pts/mes` : "Sin cuota configurada"}
                            </div>
                            <button
                              onClick={() => { setEditingMonthlyId(client.id); setMonthlyInput(String(client.monthly_points)); }}
                              className="px-4 py-2 rounded-lg text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors">
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-neutral-600 text-xs mt-1.5">
                        Se usa al hacer clic en "Recarga mensual" en el panel de arriba.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
