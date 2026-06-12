import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-neutral-950 overflow-hidden">
      {/* Fondo placeholder — reemplazar con imagen real */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black" />
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-400 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-32">
        <p className="text-neutral-400 text-sm font-medium tracking-widest uppercase mb-6">
          Palermo · Microcentro
        </p>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight max-w-3xl mb-8">
          Tu lugar para trabajar en Buenos Aires
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          Dos sedes, más de 5.000 m², y todo lo que necesitás para arrancar el día.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="#servicios"
            className="bg-white text-neutral-900 px-8 py-4 rounded-full font-medium hover:bg-neutral-100 transition-colors text-center"
          >
            Ver servicios
          </Link>
          <Link
            href="#contacto"
            className="border border-neutral-600 text-white px-8 py-4 rounded-full font-medium hover:border-white transition-colors text-center"
          >
            Contactanos
          </Link>
        </div>
      </div>
    </section>
  );
}
