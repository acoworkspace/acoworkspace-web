import Link from "next/link";
import type { ContentMap } from "@/lib/site-content";

export default function Hero({ content = {} }: { content?: ContentMap }) {
  const g = (key: string, fb: string) => content[`hero.${key}`] || fb;
  const bgImage = g("image", "/hero.jpg");
  const bgPosition = g("image_position", "center center");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url('${bgImage}')`, backgroundPosition: bgPosition }} />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative max-w-7xl mx-auto px-6 py-32 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-base font-semibold border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/40 cursor-default">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }} />
            {g("pill_1", "Palermo")}
          </span>
          <span className="text-white/30 text-sm">·</span>
          <span className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-base font-semibold border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/40 cursor-default">
            <span className="w-2.5 h-2.5 rounded-full bg-[#627A38]" />
            {g("pill_2", "Monserrat")}
          </span>
        </div>
        <h1 className="text-4xl md:text-7xl font-bold text-white leading-tight max-w-4xl mb-8">
          {g("title", "Tu lugar para trabajar")}{" "}
          <span className="aco-gradient-text">{g("title_accent", "en Buenos Aires")}</span>
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          {g("subtitle", "Dos sedes, más de 5.000 m², y todo lo que necesitás para arrancar el día.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#servicios"
            className="aco-gradient text-white px-8 py-4 rounded-full font-medium hover:opacity-90 transition-opacity text-center">
            {g("cta_primary", "Ver servicios")}
          </Link>
          <Link href="#contacto"
            className="border border-neutral-600 text-white px-8 py-4 rounded-full font-medium hover:border-white hover:bg-white/5 transition-colors text-center">
            {g("cta_secondary", "Contactanos")}
          </Link>
        </div>
      </div>
    </section>
  );
}
