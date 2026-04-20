const isValidGalleryItem = (item) =>
  item && typeof item.url === "string" && item.url.trim().length > 0;

export function getProductGallery(product = {}) {
  const legacyUrl = typeof product.imageUrl === "string" ? product.imageUrl.trim() : "";
  const gallery = Array.isArray(product.gallery) ? product.gallery.filter(isValidGalleryItem) : [];

  if (!gallery.length) {
    return legacyUrl
      ? [
          {
            id: "legacy-cover",
            url: legacyUrl,
            alt: product.name || "Produto",
            isCover: true,
            order: 0,
          },
        ]
      : [];
  }

  const sortedGallery = [...gallery].sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return sortedGallery.map((item, index) => ({
    id: item.id || `gallery-${index}`,
    url: item.url,
    alt: item.alt || product.name || `Imagem ${index + 1}`,
    isCover: index === 0,
    order: index,
  }));
}

export function getProductCoverImage(product = {}) {
  return getProductGallery(product)[0]?.url || "";
}

export function normalizeProductMedia(product = {}) {
  const gallery = getProductGallery(product);

  return {
    ...product,
    gallery,
    imageUrl: gallery[0]?.url || "",
  };
}
