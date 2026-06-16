"use client";

import { useEffect, useState } from "react";
import { TextField, ImageField, PillsField, GalleryField, GalleryItem } from "./ContentField";

type Section = "hero" | "stats" | "services" | "locations" | "contact";

const SECTIONS: { key: Section; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "stats", label: "Estadísticas" },
  { key: "services", label: "Servicios" },
  { key: "locations", label: "Sedes" },
  { key: "contact", label: "Contacto" },
];

type ContentMap = Record<string, string>;

async function saveField(section: string, key: string, value: string) {
  await fetch("/api/admin/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section, key, value }),
  });
}

export default function ContenidoPage() {
  const [active, setActive] = useState<Section>("hero");
  const [content, setContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/content/all")
      .then((r) => r.json())
      .then(({ content }) => { setContent(content ?? {}); setLoading(false); });
  }, []);

  const get = (section: string, key: string, fallback = "") =>
    content[`${section}.${key}`] ?? fallback;

  const save = (section: string, key: string) => async (value: string) => {
    await saveField(section, key, value);
    setContent((prev) => ({ ...prev, [`${section}.${key}`]: value }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-neutral-800 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-900 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Contenido de la landing</h1>
        <p className="text-neutral-500 text-sm mt-1">Editá textos e imágenes sin tocar el código</p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 mb-8 w-fit">
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => setActive(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === s.key ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">

        {/* HERO */}
        {active === "hero" && (
          <div className="space-y-6">
            <SectionCard title="Textos">
              <TextField label="Pill 1 (sede izquierda, ej: Palermo)"
                value={get("hero", "pill_1", "Palermo")}
                onSave={save("hero", "pill_1")} />
              <TextField label="Pill 2 (sede derecha, ej: Monserrat)"
                value={get("hero", "pill_2", "Monserrat")}
                onSave={save("hero", "pill_2")} />
              <TextField label="Título — línea principal"
                value={get("hero", "title", "Tu lugar para trabajar")}
                onSave={save("hero", "title")} />
              <TextField label="Título — texto con color"
                value={get("hero", "title_accent", "en Buenos Aires")}
                onSave={save("hero", "title_accent")} />
              <TextField label="Subtítulo" multiline
                value={get("hero", "subtitle", "Dos sedes, más de 5.000 m², y todo lo que necesitás para arrancar el día.")}
                onSave={save("hero", "subtitle")} />
              <TextField label="Botón primario"
                value={get("hero", "cta_primary", "Ver servicios")}
                onSave={save("hero", "cta_primary")} />
              <TextField label="Botón secundario"
                value={get("hero", "cta_secondary", "Contactanos")}
                onSave={save("hero", "cta_secondary")} />
            </SectionCard>
            <SectionCard title="Imagen de fondo">
              <ImageField label="Foto del hero"
                currentUrl={get("hero", "image", "/hero.jpg")}
                currentPosition={get("hero", "image_position", "center center")}
                storagePath="hero/hero.jpg"
                onSave={save("hero", "image")}
                onSavePosition={save("hero", "image_position")} />
            </SectionCard>
          </div>
        )}

        {/* STATS */}
        {active === "stats" && (
          <div className="space-y-4">
            {[
              { val: "+35", label: "empresas" },
              { val: "+5.000 m²", label: "de espacio" },
              { val: "+10", label: "pisos" },
              { val: "2", label: "sedes" },
            ].map((def, i) => (
              <SectionCard key={i} title={`Estadística ${i + 1}`}>
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="Número / valor"
                    value={get("stats", `${i}_value`, def.val)}
                    onSave={save("stats", `${i}_value`)} />
                  <TextField label="Etiqueta"
                    value={get("stats", `${i}_label`, def.label)}
                    onSave={save("stats", `${i}_label`)} />
                </div>
              </SectionCard>
            ))}
          </div>
        )}

        {/* SERVICES */}
        {active === "services" && (
          <div className="space-y-6">
            {[
              {
                name: "Oficinas privadas", slug: "oficinas-privadas",
                desc: "Espacios exclusivos para tu equipo, con todo lo que necesitás sin pensar en nada más.",
                sedes: ["palermo", "microcentro"] as const,
                sedeLabels: ["Palermo", "Monserrat"],
              },
              {
                name: "Desks", slug: "desks",
                desc: "Escritorio propio en un espacio compartido con otros coworkers.",
                sedes: ["palermo", "microcentro"] as const,
                sedeLabels: ["Palermo", "Monserrat"],
              },
              {
                name: "Salas de reuniones", slug: "salas-de-reuniones",
                desc: "Espacios equipados para reuniones de equipo, presentaciones y videollamadas.",
                sedes: ["palermo", "microcentro"] as const,
                sedeLabels: ["Palermo", "Monserrat"],
              },
              {
                name: "Producciones", slug: "producciones",
                desc: "Un espacio amplio y versátil para eventos, rodajes y producciones audiovisuales.",
                sedes: ["palermo"] as const,
                sedeLabels: ["Palermo"],
              },
            ].map((def, i) => (
              <div key={i} className="space-y-4">
                <SectionCard title={`${def.name} — Textos`}>
                  <TextField label="Nombre del servicio"
                    value={get("services", `${i}_name`, def.name)}
                    onSave={save("services", `${i}_name`)} />
                  <TextField label="Descripción" multiline
                    value={get("services", `${i}_description`, def.desc)}
                    onSave={save("services", `${i}_description`)} />
                  <PillsField label="Incluye"
                    value={get("services", `${i}_amenities`, "")}
                    onSave={save("services", `${i}_amenities`)} />
                </SectionCard>

                <SectionCard title={`${def.name} — Foto de la card`}>
                  <ImageField label="Foto principal (aparece en la grilla de servicios)"
                    currentUrl={get("services", `${i}_card_image`, "")}
                    currentPosition={get("services", `${i}_card_image_position`, "50% 50%")}
                    storagePath={`services/${def.slug}/card.jpg`}
                    aspect="4/3"
                    onSave={save("services", `${i}_card_image`)}
                    onSavePosition={save("services", `${i}_card_image_position`)} />
                </SectionCard>

                {def.sedes.map((sede, si) => {
                  const galleryItems: GalleryItem[] = [0,1,2,3,4,5].map(j => ({
                    url: get("services", `${i}_${sede}_image_${j}`, ""),
                    position: get("services", `${i}_${sede}_image_${j}_position`, "50% 50%"),
                  }));
                  return (
                  <SectionCard key={sede} title={`${def.name} — Galería ${def.sedeLabels[si]}`}>
                    <GalleryField
                      label="Fotos de la galería"
                      items={galleryItems}
                      storagePath={(j) => `services/${def.slug}/${sede}-${j}.jpg`}
                      onSaveItem={async (j, url, pos) => {
                        await save("services", `${i}_${sede}_image_${j}`)(url);
                        await save("services", `${i}_${sede}_image_${j}_position`)(pos);
                      }}
                      onReorder={async (reordered) => {
                        await Promise.all(reordered.map((item, j) => Promise.all([
                          save("services", `${i}_${sede}_image_${j}`)(item.url.replace(/\?t=\d+$/, "")),
                          save("services", `${i}_${sede}_image_${j}_position`)(item.position),
                        ])));
                      }}
                    />
                  </SectionCard>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* LOCATIONS */}
        {active === "locations" && (
          <div className="space-y-6">
            {[
              {
                name: "Palermo",
                address: "Av. Raúl Scalabrini Ortiz 1135",
                desc: "Nuestro espacio principal. Planta baja con bar, lounge en el primer piso, terraza y área de trabajo individual en el 8vo piso.",
              },
              {
                name: "Monserrat",
                address: "Lima 251",
                desc: "En el corazón de la ciudad. Espacios cómodos y funcionales para equipos que necesitan estar en el centro de todo.",
              },
            ].map((def, i) => (
              <SectionCard key={i} title={def.name}>
                <TextField label="Nombre de la sede"
                  value={get("locations", `${i}_name`, def.name)}
                  onSave={save("locations", `${i}_name`)} />
                <TextField label="Dirección"
                  value={get("locations", `${i}_address`, def.address)}
                  onSave={save("locations", `${i}_address`)} />
                <TextField label="Descripción" multiline
                  value={get("locations", `${i}_description`, def.desc)}
                  onSave={save("locations", `${i}_description`)} />
                <TextField label="Link de Google Maps"
                  value={get("locations", `${i}_map_url`, "")}
                  onSave={save("locations", `${i}_map_url`)} />
                <ImageField label="Foto de la sede"
                  currentUrl={get("locations", `${i}_image`, "")}
                  currentPosition={get("locations", `${i}_image_position`, "center center")}
                  storagePath={`locations/${i === 0 ? "palermo" : "microcentro"}.jpg`}
                  onSave={save("locations", `${i}_image`)}
                  onSavePosition={save("locations", `${i}_image_position`)} />
              </SectionCard>
            ))}
          </div>
        )}

        {/* CONTACT */}
        {active === "contact" && (
          <div className="space-y-4">
            <SectionCard title="Textos">
              <TextField label="Título"
                value={get("contact", "title", "¿Querés saber más?")}
                onSave={save("contact", "title")} />
              <TextField label="Subtítulo"
                value={get("contact", "subtitle", "Completá el formulario y te respondemos a la brevedad.")}
                onSave={save("contact", "subtitle")} />
            </SectionCard>
            <SectionCard title="Foto">
              <ImageField label="Foto"
                currentUrl={get("contact", "image", "")}
                currentPosition={get("contact", "image_position", "50% 50%")}
                storagePath="contact/imagen.jpg"
                aspect="3/4"
                onSave={save("contact", "image")}
                onSavePosition={save("contact", "image_position")} />
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-5">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
