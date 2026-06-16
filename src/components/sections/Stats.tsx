import type { ContentMap } from "@/lib/site-content";

const DEFAULTS = [
  { value: "+35", label: "empresas" },
  { value: "+5.000 m²", label: "de espacio" },
  { value: "+10", label: "pisos" },
  { value: "2", label: "sedes" },
];

export default function Stats({ content = {} }: { content?: ContentMap }) {
  const stats = DEFAULTS.map((d, i) => ({
    value: content[`stats.${i}_value`] || d.value,
    label: content[`stats.${i}_label`] || d.label,
  }));

  return (
    <section className="py-10 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="group cursor-default transition-transform duration-200 hover:-translate-y-1">
              <div className="text-3xl font-bold mb-1 transition-colors group-hover:text-white" style={{ color: "inherit" }}>{stat.value}</div>
              <div className="text-neutral-400 text-xs uppercase tracking-widest transition-colors group-hover:text-neutral-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
