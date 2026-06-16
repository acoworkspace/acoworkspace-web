import { getSiteContent, get, storageUrl } from "@/lib/site-content";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Gallery from "./Gallery";

export const revalidate = 60;

const SERVICES = [
  {
    slug: "oficinas-privadas",
    index: 0,
    name: "Oficinas privadas",
    whatsappMessage: "Hola! Me gustaria consultar por precio de oficinas privadas",
    description: "Espacios exclusivos para tu equipo, con todo lo que necesitás sin pensar en nada más.",
    sedes: ["palermo", "microcentro"],
    sedeLabels: ["Palermo", "Monserrat"],
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
    slug: "desks",
    index: 1,
    name: "Desks",
    whatsappMessage: "Hola! Me gustaria consultar por precio de desks",
    description: "Escritorio propio en un espacio compartido con otros coworkers. Ergonómico, fijo y tuyo.",
    sedes: ["palermo", "microcentro"],
    sedeLabels: ["Palermo", "Monserrat"],
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
    slug: "salas-de-reuniones",
    index: 2,
    name: "Salas de reuniones",
    whatsappMessage: "Hola! Me gustaria consultar por precio de salas de reuniones",
    description: "Espacios equipados para reuniones de equipo, presentaciones y videollamadas. Reservá por hora y concentrá todo en un mismo lugar.",
    sedes: ["palermo", "microcentro"],
    sedeLabels: ["Palermo", "Monserrat"],
    amenities: [
      "TV",
      "Aire acondicionado",
      "Pizarra",
      "Dispensers de agua",
      "Infusiones y snacks",
      "WiFi de alta velocidad",
      "Baño privado",
      "Bicicletero sin cargo en el primer subsuelo",
      "Acceso a todas las áreas comunes del edificio",
    ],
  },
  {
    slug: "producciones",
    index: 3,
    name: "Producciones",
    whatsappMessage: "Hola! Me gustaria consultar por precio de producciones",
    description: "Un espacio amplio y versátil para eventos, rodajes y producciones audiovisuales.",
    sedes: ["palermo"],
    sedeLabels: ["Palermo"],
    amenities: [
      "Espacio amplio y luminoso",
      "Acceso a áreas comunes",
      "Ideal para eventos y shootings",
      "Disponibilidad por jornada",
    ],
  },
];

export async function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  const content = await getSiteContent("services");
  const i = service.index;

  const name = get(content, `services.${i}_name`, service.name);
  const description = get(content, `services.${i}_description`, service.description);
  const amenitiesFromCms = get(content, `services.${i}_amenities`, "");
  const amenities = amenitiesFromCms
    ? amenitiesFromCms.split("\n").filter(Boolean)
    : service.amenities;
  const cardImage = get(content, `services.${i}_card_image`, "");

  // Gallery images per sede: up to 6 each
  const sedeGalleries = service.sedes.map((sede) => {
    const images: string[] = [];
    for (let j = 0; j < 6; j++) {
      const url = get(content, `services.${i}_${sede}_image_${j}`, "");
      if (url) images.push(url);
    }
    return { sede, label: service.sedeLabels[service.sedes.indexOf(sede)], images };
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <div className="border-b border-neutral-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link href="/#servicios" className="text-neutral-400 hover:text-neutral-700 text-sm transition-colors">
            ← Volver
          </Link>
          <span className="text-neutral-200">/</span>
          <span className="text-sm text-neutral-500">{name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-72 md:h-96 bg-neutral-100 overflow-hidden">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={name}
            fill
            className="object-cover"
            style={{ objectPosition: get(content, `services.${i}_card_image_position`, "50% 50%") }}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 pb-10 w-full">
            <p className="text-white/60 text-sm font-medium tracking-widest uppercase mb-2">Servicios</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white">{name}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Description */}
        <div className="max-w-2xl mb-16">
          <p className="text-neutral-600 text-xl leading-relaxed mb-8">{description}</p>
          <a
            href={`https://wa.me/5491128592763?text=${encodeURIComponent(service.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white rounded-full px-8 py-3 font-medium hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }}
          >
            Consultar precio
          </a>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mb-20">
            <h3 className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-8">¿Qué incluye?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenities.map((item) => (
                <div key={item} className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 rounded-xl px-5 py-4 transition-all duration-200 hover:border-neutral-300 hover:bg-white hover:shadow-sm cursor-default">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #C0201A, #E03A1A)" }} />
                  <span className="text-base text-neutral-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sedes galleries */}
        {sedeGalleries.map(({ sede, label, images }) => (
          <div key={sede} className="mb-16">
            {service.sedes.length > 1 && (
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-neutral-900">{label}</h2>
                <div className="h-px flex-1 bg-neutral-100" />
              </div>
            )}

            {images.length > 0 ? (
              <Gallery
                images={images.map((url, j) => ({
                  url,
                  position: get(content, `services.${i}_${sede}_image_${j}_position`, "50% 50%"),
                }))}
                name={name}
                label={label}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-neutral-200 h-48 flex items-center justify-center">
                <p className="text-neutral-400 text-sm">Las fotos aparecen acá una vez cargadas desde el back office</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
