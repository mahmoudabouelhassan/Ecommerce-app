export const productPlaceholder = `${import.meta.env.BASE_URL}product-placeholder.svg`;

export const getProductImage = (product) =>
  product?.image || product?.images?.find(Boolean) || productPlaceholder;

export const useProductImageFallback = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = productPlaceholder;
};
