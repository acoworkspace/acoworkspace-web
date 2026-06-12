"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center">
          <Image src="/aco-logo.webp" alt="ACO Workspace" width={120} height={36} className="h-8 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          <Link href="#servicios" className="hover:text-neutral-900 transition-colors">Servicios</Link>
          <Link href="#sedes" className="hover:text-neutral-900 transition-colors">Sedes</Link>
          <Link href="#contacto" className="hover:text-neutral-900 transition-colors">Contacto</Link>
          <Link href="/reservas" className="bg-neutral-900 text-white px-5 py-2 rounded-full hover:bg-neutral-700 transition-colors">
            Reservar
          </Link>
        </nav>

        <button
          className="md:hidden p-2 text-neutral-600"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          <span className={`block w-5 h-0.5 bg-current mb-1 transition-transform ${open ? "rotate-45 translate-y-1.5" : ""}`} />
          <span className={`block w-5 h-0.5 bg-current mb-1 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-current transition-transform ${open ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-medium text-neutral-600">
          <Link href="#servicios" onClick={() => setOpen(false)}>Servicios</Link>
          <Link href="#sedes" onClick={() => setOpen(false)}>Sedes</Link>
          <Link href="#contacto" onClick={() => setOpen(false)}>Contacto</Link>
          <Link href="/reservas" className="bg-neutral-900 text-white px-5 py-2.5 rounded-full text-center">
            Reservar
          </Link>
        </div>
      )}
    </header>
  );
}
