"use client";

import { useState, useEffect, useCallback } from "react";

interface LightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}>

      {/* Close */}
      <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none transition-colors z-10"
        onClick={onClose}>×</button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {current + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); prev(); }}>
          ←
        </button>
      )}

      {/* Image */}
      <img
        src={images[current].url}
        alt={images[current].alt || ""}
        className="block w-auto h-auto max-w-[90vw] max-h-[85vh] rounded-xl select-none object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); next(); }}>
          →
        </button>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/30"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// Hook + trigger for gallery grids
export function useGalleryLightbox(images: { url: string; alt?: string }[]) {
  const [open, setOpen] = useState<number | null>(null);
  const trigger = (i: number) => setOpen(i);
  const lightbox = open !== null ? (
    <Lightbox images={images} initialIndex={open} onClose={() => setOpen(null)} />
  ) : null;
  return { trigger, lightbox };
}
