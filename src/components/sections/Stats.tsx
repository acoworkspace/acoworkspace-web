const stats = [
  { value: "5.000 m²", label: "entre ambas sedes" },
  { value: "2", label: "sedes en Buenos Aires" },
  { value: "3", label: "tipos de espacio" },
];

export default function Stats() {
  return (
    <section className="py-20 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-neutral-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
