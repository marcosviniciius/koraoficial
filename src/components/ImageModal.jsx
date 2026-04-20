"use client";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect } from "react";

export default function ImageModal({ isOpen, onClose, gallery = [], activeIndex = 0, setActiveIndex }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (gallery.length <= 1) return;
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gallery.length, isOpen, onClose, setActiveIndex]);

  if (!isOpen || !gallery.length) return null;

  const currentImage = gallery[activeIndex] || gallery[0];
  const hasMultipleImages = gallery.length > 1;

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
      onClick={onClose}
    >
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210] hover:rotate-90"
      >
        <X size={32} />
      </button>

      {/* Image Container */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4 md:p-12 animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={currentImage.url}
          alt={currentImage.alt || "Imagem em tela cheia"} 
          className="max-w-full max-h-full object-contain shadow-2xl rounded-sm cursor-zoom-out"
          onClick={onClose}
        />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronLeft size={26} />
            </button>

            <button
              type="button"
              onClick={goToNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {/* Helper Text */}
      <div className="absolute bottom-6 left-0 right-0 px-4">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4">
          {hasMultipleImages && (
            <div className="flex max-w-full gap-2 overflow-x-auto rounded-full bg-white/5 px-3 py-2 show-scrollbars-modern">
              {gallery.map((image, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveIndex(index);
                    }}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border transition ${isActive ? "border-white" : "border-white/20 opacity-70 hover:opacity-100"}`}
                  >
                    <img src={image.url} alt={image.alt} className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-center pointer-events-none">
            {hasMultipleImages && (
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
                <Images size={12} />
                {activeIndex + 1} de {gallery.length}
              </p>
            )}
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">Clique em qualquer lugar para fechar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
