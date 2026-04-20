"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { getProductGallery } from "@/lib/productMedia";

export default function ProductGallery({
  product,
  onOpenImage,
  containerClassName = "",
  imageClassName = "",
  thumbnailClassName = "",
}) {
  const gallery = getProductGallery(product);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!gallery.length) {
    return (
      <div className={`space-y-3 ${containerClassName}`}>
        <div className="aspect-square w-full rounded-[1.75rem] border border-border-dim bg-surface-hover flex items-center justify-center">
          <div className="font-logo text-5xl text-slate-300">KORA</div>
        </div>
      </div>
    );
  }

  const activeImage = gallery[activeIndex] || gallery[0];
  const hasMultipleImages = gallery.length > 1;

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  const handleOpen = () => {
    if (onOpenImage) {
      onOpenImage(gallery, activeIndex);
    }
  };

  return (
    <div className={`space-y-3 ${containerClassName}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.75rem] border border-border-dim bg-surface-hover">
        <img
          src={activeImage.url}
          alt={activeImage.alt}
          className={`h-full w-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-[1.03] ${imageClassName}`}
          onClick={handleOpen}
        />

        {hasMultipleImages && (
          <>
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              <Images size={12} />
              {gallery.length} fotos
            </div>

            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-lg transition hover:bg-white"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-lg transition hover:bg-white"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">
              {activeIndex + 1}/{gallery.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1 show-scrollbars-modern">
          {gallery.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition ${isActive ? "border-[var(--color-kora-blue)] shadow-md shadow-blue-100" : "border-border-dim opacity-80 hover:opacity-100"} ${thumbnailClassName}`}
              >
                <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                {isActive && <div className="absolute inset-0 ring-2 ring-[var(--color-kora-blue)] ring-inset rounded-2xl" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
