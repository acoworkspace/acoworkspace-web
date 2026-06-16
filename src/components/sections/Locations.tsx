"use client";

import type { ContentMap } from "@/lib/site-content";
import Image from "next/image";

const DEFAULT_LOCATIONS = [
  {
    name: "Palermo",
    address: "Av. Raúl Scalabrini Ortiz 1135",
    services: ["Oficinas privadas", "Desks", "Producciones"],
    description:
      "Nuestro espacio principal. Planta baja con bar, lounge en el primer piso, terraza y área de trabajo individual en el 8vo piso. Luminoso, amplio y pensado para el día a día.",
    mapUrl: "https://maps.app.goo.gl/B7CCuJX8Dd29b7vi9",
    accent: "#C0201A",
    tagBg: "#fee2e2",
    tagColor: "#991b1b",
    imageFirst: true,
  },
  {
    name: "Monserrat",
    address: "Lima 251",
    services: ["Oficinas privadas", "Desks"],
    description:
      "En el corazón de la ciudad. Espacios cómodos y funcionales para equipos que necesitan estar en el centro de todo.",
    mapUrl: "https://maps.app.goo.gl/kLDiAvktbzvT6fFo6",
    accent: "#627A38",
    tagBg: "#dce5c8",
    tagColor: "#3d4e22",
    imageFirst: false,
  },
];

export default function Locations({ content = {} }: { content?: ContentMap }) {
  const locations = DEFAULT_LOCATIONS.map((d, i) => ({
    ...d,
    name: content[`locations.${i}_name`] || d.name,
    address: content[`locations.${i}_address`] || d.address,
    description: content[`locations.${i}_description`] || d.description,
    mapUrl: content[`locations.${i}_map_url`] || d.mapUrl,
    image: content[`locations.${i}_image`] || "",
    imagePosition: content[`locations.${i}_image_position`] || "center center",
  }));

  return (
    <section id="sedes" className="py-28 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16">
          <p className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">
            Sedes
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 leading-tight">
            Dos espacios, la misma experiencia
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className={`group flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white border border-neutral-200 transition-all duration-300 hover:shadow-lg ${
                loc.imageFirst ? "" : "md:flex-row-reverse"
              }`}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${loc.accent}`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
            >
              {/* Imagen */}
              <div className="relative md:w-1/2 h-64 md:h-auto overflow-hidden bg-neutral-100 shrink-0">
                {loc.image ? (
                  <Image
                    src={loc.image}
                    alt={loc.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectPosition: loc.imagePosition }}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ color: loc.accent }}>
                    <span className="text-sm opacity-40">Foto {loc.name}</span>
                  </div>
                )}
                {/* Barra de color lateral */}
                <div
                  className={`absolute top-0 bottom-0 w-1 ${loc.imageFirst ? "right-0" : "left-0"}`}
                  style={{ background: loc.accent }}
                />
              </div>

              {/* Contenido */}
              <div className="flex flex-col justify-center p-10 md:w-1/2">
                <div className="flex flex-wrap gap-2 mb-5">
                  {loc.services.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: loc.tagBg, color: loc.tagColor }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <h3 className="text-3xl font-bold text-neutral-900 mb-1">{loc.name}</h3>
                <p className="text-sm mb-5" style={{ color: loc.accent }}>📍 {loc.address}</p>

                <p className="text-neutral-500 text-sm leading-relaxed mb-8">{loc.description}</p>

                <a
                  href={loc.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70 w-fit"
                  style={{ color: loc.accent }}
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
