const services = [
  {
    name: "Oficinas privadas",
    sedes: ["Palermo", "Microcentro"],
    description:
      "Espacios exclusivos para tu equipo, con todo lo que necesitás sin pensar en nada más.",
    amenities: [
      "Acceso a todas las áreas comunes",
      "Bar, lounge, terraza y área individual",
      "Agua, café, snacks y frutas",
      "Impresiones en blanco y negro",
      "Cabinas para llamadas",
      "Salas de reuniones por créditos",
      "Bicicletero sin cargo",
    ],
  },
  {
    name: "Desks",
    sedes: ["Palermo", "Microcentro"],
    description:
      "Escritorio propio en un espacio compartido con otros coworkers. Ergonómico, fijo y tuyo.",
    amenities: [
      "Escritorio individual + silla ergonómica",
      "Acceso a todas las áreas comunes",
      "Agua, café y snacks",
      "WiFi de alta velocidad",
      "Limpieza incluida",
      "Cabinas para llamadas",
      "Salas de reuniones por créditos",
      "Bicicletero sin cargo",
    ],
  },
  {
    name: "Producciones",
    sedes: ["Palermo"],
    description:
      "Un espacio amplio y versátil para eventos, rodajes y producciones audiovisuales. Traés tu equipo, nosotros ponemos el lugar.",
    amenities: [
      "Espacio amplio y luminoso",
      "Acceso a áreas comunes",
      "Ideal para eventos y shootings",
      "Disponibilidad por jornada",
    ],
  },
];

export default function Services() {
  return (
    <section id="servicios" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">
            Servicios
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 max-w-2xl leading-tight">
            Encontrá la modalidad que se adapta a vos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.name}
              className="border border-neutral-200 rounded-2xl p-8 flex flex-col hover:border-neutral-400 transition-colors"
            >
              <div className="mb-6">
                <div className="flex gap-2 mb-4">
                  {service.sedes.map((sede) => (
                    <span
                      key={sede}
                      className="text-xs font-medium bg-neutral-100 text-neutral-500 px-3 py-1 rounded-full"
                    >
                      {sede}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  {service.name}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>

              <ul className="space-y-2 mb-8 flex-1">
                {service.amenities.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-600">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-neutral-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className="mt-auto border border-neutral-900 text-neutral-900 rounded-full px-6 py-3 text-sm font-medium text-center hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Consultar precio
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
