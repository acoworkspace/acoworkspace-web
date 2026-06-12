const locations = [
  {
    name: "Palermo",
    address: "Av. Raúl Scalabrini Ortiz 1135",
    services: ["Oficinas privadas", "Desks", "Producciones"],
    description:
      "Nuestro espacio principal. Planta baja con bar, lounge en el primer piso, terraza y área de trabajo individual en el 8vo piso. Luminoso, amplio y pensado para el día a día.",
    mapUrl: "https://maps.google.com/?q=Av.+Raúl+Scalabrini+Ortiz+1135,+Palermo,+Buenos+Aires",
  },
  {
    name: "Microcentro",
    address: "Lima 251",
    services: ["Oficinas privadas", "Desks"],
    description:
      "En el corazón de la ciudad. Espacios cómodos y funcionales para equipos que necesitan estar en el centro de todo.",
    mapUrl: "https://maps.google.com/?q=Lima+251,+Microcentro,+Buenos+Aires",
  },
];

export default function Locations() {
  return (
    <section id="sedes" className="py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">
            Sedes
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 max-w-2xl leading-tight">
            Dos espacios en Buenos Aires
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations.map((loc) => (
            <div key={loc.name} className="bg-white rounded-2xl overflow-hidden border border-neutral-200">
              {/* Placeholder imagen — reemplazar con foto real */}
              <div className="h-56 bg-neutral-200 flex items-center justify-center text-neutral-400 text-sm">
                Foto {loc.name}
              </div>

              <div className="p-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">{loc.name}</h3>
                <p className="text-neutral-400 text-sm mb-4">📍 {loc.address}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {loc.services.map((s) => (
                    <span key={s} className="text-xs font-medium bg-neutral-100 text-neutral-500 px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>

                <p className="text-neutral-500 text-sm leading-relaxed mb-6">{loc.description}</p>

                <a
                  href={loc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600 transition-colors"
                >
                  Ver en el mapa →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
