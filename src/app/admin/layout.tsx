"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "◈", roles: ["admin", "receptionist"] },
  { href: "/admin/salas", label: "Salas", icon: "⊞", roles: ["admin", "receptionist"] },
  { href: "/admin/reservas", label: "Reservas", icon: "◷", roles: ["admin", "receptionist"] },
  { href: "/admin/clientes", label: "Clientes", icon: "◎", roles: ["admin", "receptionist"] },
  { href: "/admin/contenido", label: "Contenido", icon: "✎", roles: ["admin"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/admin/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "receptionist")) {
        await supabase.auth.signOut();
        router.replace("/admin/login?error=no_access");
        return;
      }

      if (profile.role === "receptionist" && pathname.startsWith("/admin/contenido")) {
        router.replace("/admin");
        return;
      }

      setUserEmail(session.user.email ?? null);
      setRole(profile.role);
      setLoading(false);
    });
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (isLoginPage) return <>{children}</>;

  if (loading || !role) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-800">
          <div className="text-white font-bold text-lg">ACO</div>
          <div className="text-neutral-500 text-xs mt-0.5">Back Office</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.filter(item => role && item.roles.includes(role)).map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-800">
          <div className="text-neutral-500 text-xs px-3 mb-2 truncate">{userEmail}</div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-base">↩</span>
            Salir
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
