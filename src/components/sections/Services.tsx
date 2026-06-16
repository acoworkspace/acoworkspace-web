"use client";

import Link from "next/link";
import Image from "next/image";
import type { ContentMap } from "@/lib/site-content";

const DEFAULT_SERVICES = [
  {
    slug: "oficinas-privadas",
    name: "Oficinas privadas",
    sedes: ["Palermo", "Monserrat"],
    description: "Espacios exclusivos para tu equipo, con todo lo que necesitás sin pensar en nada más.",
    amenities: ["Acceso a todas las áreas comunes","Bar, lounge, terraza y área individual","Agua, café, snacks y frutas","Impresiones en blanco y negro","Cabinas para llamadas","Salas de reuniones por créditos","Bicicletero sin cargo"],
  },
  {
    slug: "desks",
    name: "Desks",
    sedes: ["Palermo", "Monserrat"],
    description: "Escritorio propio en un espacio compartido con otros coworkers. Ergonómico, fijo y tuyo.",
    amenities: ["Escritorio individual + silla ergonómica","Acceso a todas las áreas comunes","Agua, café y snacks","WiFi de alta velocidad","Limpieza incluida","Cabinas para llamadas","Salas de reuniones por créditos","Bicicletero sin cargo"],
  },
  {
    slug: "salas-de-reuniones",
    name: "Salas de reuniones",
    sedes: ["Palermo", "Monserrat"],
    description: "Espacios equipados para reuniones de equipo, presentaciones y videollamadas. Reservá por hora y concentrá todo en un mismo lugar.",
    amenities: ["TV","Aire acondicionado","Pizarra","Dispensers de agua","Infusiones y snacks","WiFi de alta velocidad","Baño privado","Bicicletero sin cargo en el primer subsuelo","Acceso a todas las áreas comunes del edificio"],
  },
  {
    slug: "producciones",
    name: "Producciones",
    sedes: ["Palermo"],
    description: "Un espacio amplio y versátil para eventos, rodajes y producciones audiovisuales. Traés tu equipo, nosotros ponemos el lugar.",
    amenities: ["Espacio amplio y luminoso","Acceso a áreas comunes","Ideal para eventos y shootings","Disponibilidad por jornada"],
  },
];

export default function Services({ content = {} }: { content?: ContentMap }) {
  const services = DEFAULT_SERVICES.map((d, i) => ({
    ...d,
    name: content[`services.${i}_name`] || d.name,
    description: content[`services.${i}_description`] || d.description,
    cardImage: content[`services.${i}_card_image`] || "",
    cardImagePosition: content[`services.${i}_card_image_position`] || "50% 50%",
  }));

  return (
    <section id="servicios" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">
            Servicios
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 leading-tight">
            Encontrá el espacio que necesitás
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/servicios/${service.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-neutral-200 transition-all duration-300 hover:shadow-lg hover:border-transparent"
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #C0201A")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
            >
              {/* Imagen */}
              <div className="relative h-56 bg-neutral-100 overflow-hidden">
                {service.cardImage ? (
                  <Image
                    src={service.cardImage}
                    alt={service.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: service.cardImagePosition }}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400 text-sm">Sin foto</span>
                  </div>
                )}
              </div>

              {/* Texto */}
              <div className="p-6">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {service.sedes.map((sede) => (
                    <span key={sede} className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={sede === "Monserrat"
                        ? { background: "#dce5c8", color: "#3d4e22" }
                        : { background: "#fee2e2", color: "#991b1b" }}>
                      {sede}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{service.name}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2">{service.description}</p>
                <p className="text-sm font-medium mt-4 transition-colors"
                  style={{ color: "#C0201A" }}>
                  Ver más →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
