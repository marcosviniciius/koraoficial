"use client";
import { createContext, useContext, useState, useCallback } from "react";
import ImageModal from "@/components/ImageModal";

const ImageModalContext = createContext(null);

export function ImageModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const openImage = useCallback((url, alt = "") => {
    setGallery(url ? [{ id: "single-image", url, alt: alt || "Imagem" }] : []);
    setActiveIndex(0);
    setIsOpen(true);
  }, []);

  const openGallery = useCallback((images = [], startIndex = 0) => {
    const normalizedGallery = Array.isArray(images)
      ? images
          .filter((item) => item && typeof item.url === "string" && item.url)
          .map((item, index) => ({
            id: item.id || `modal-image-${index}`,
            url: item.url,
            alt: item.alt || `Imagem ${index + 1}`,
          }))
      : [];

    setGallery(normalizedGallery);
    setActiveIndex(
      normalizedGallery.length ? Math.max(0, Math.min(startIndex, normalizedGallery.length - 1)) : 0
    );
    setIsOpen(normalizedGallery.length > 0);
  }, []);

  const closeImage = useCallback(() => {
    setIsOpen(false);
    setGallery([]);
    setActiveIndex(0);
  }, []);

  return (
    <ImageModalContext.Provider
      value={{ isOpen, gallery, activeIndex, setActiveIndex, openImage, openGallery, closeImage }}
    >
      {children}
      <ImageModal
        isOpen={isOpen}
        onClose={closeImage}
        gallery={gallery}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </ImageModalContext.Provider>
  );
}

export function useImageModal() {
  const ctx = useContext(ImageModalContext);
  if (!ctx) throw new Error("useImageModal must be used within ImageModalProvider");
  return ctx;
}
