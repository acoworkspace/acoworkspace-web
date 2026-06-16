"use client";

import { useGalleryLightbox } from "@/components/Lightbox";

interface Props {
  images: { url: string; position: string }[];
  name: string;
  label: string;
}

// col-span and aspect-ratio per slot index so rows always sum to 3 cols
const SLOTS = [
  { span: "col-span-1", aspect: "4/5" },   // row 1: portrait
  { span: "col-span-2", aspect: "16/9" },  // row 1: wide
  { span: "col-span-2", aspect: "16/9" },  // row 2: wide
  { span: "col-span-1", aspect: "4/5" },   // row 2: portrait
  { span: "col-span-1", aspect: "4/5" },   // row 3
  { span: "col-span-1", aspect: "4/5" },   // row 3
];

export default function Gallery({ images, name, label }: Props) {
  const lightboxImages = images.map((img, j) => ({ url: img.url, alt: `${name} ${label} ${j + 1}` }));
  const { trigger, lightbox } = useGalleryLightbox(lightboxImages);

  return (
    <>
      {lightbox}
      <div className="grid grid-cols-3 gap-3">
        {images.map((img, j) => {
          const slot = SLOTS[j] ?? { span: "col-span-1", aspect: "1/1" };
          return (
            <div
              key={j}
              className={`group relative rounded-xl overflow-hidden bg-neutral-100 cursor-pointer ${slot.span}`}
              style={{ aspectRatio: slot.aspect }}
              onClick={() => trigger(j)}
            >
              <img
                src={img.url}
                alt={`${name} ${label} ${j + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: img.position }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white text-sm font-medium bg-black/40 rounded-full px-3 py-1">Ver</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
