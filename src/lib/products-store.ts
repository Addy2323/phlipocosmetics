import { products as defaultProducts, Product } from "@/data/shop";

export interface StoredProduct extends Product {
  cost?: number;
  isArchived?: boolean;
}

export const PRODUCTS_STORAGE_KEY = "philipo_admin_products_v1";
export const PRODUCTS_UPDATE_EVENT = "philipo_products_updated";

/**
 * Retrieve current stored products list from localStorage, falling back to default shop products.
 */
export function getStoredProducts(): StoredProduct[] {
  if (typeof window === "undefined") {
    return defaultProducts.map((p) => ({
      ...p,
      cost: Math.round(p.price * 0.45),
      isArchived: false,
    }));
  }

  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      const initialized = defaultProducts.map((p) => ({
        ...p,
        cost: Math.round(p.price * 0.45),
        isArchived: false,
      }));
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(initialized));
      return initialized;
    }
    const parsed = JSON.parse(raw) as StoredProduct[];
    const existingIds = new Set(parsed.map((p) => p.id));
    let hasNew = false;
    const merged = [...parsed];
    for (const dp of defaultProducts) {
      if (!existingIds.has(dp.id)) {
        merged.push({
          ...dp,
          cost: Math.round(dp.price * 0.45),
          isArchived: false,
        });
        hasNew = true;
      }
    }
    if (hasNew) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    console.error("Failed to parse stored products:", err);
    return defaultProducts.map((p) => ({
      ...p,
      cost: Math.round(p.price * 0.45),
      isArchived: false,
    }));
  }
}

/**
 * Save products to localStorage and dispatch update event to keep all tabs/views in sync.
 */
export function saveStoredProducts(list: StoredProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATE_EVENT, { detail: list }));
  } catch (err) {
    console.error("Failed to save stored products:", err);
  }
}

/**
 * Update the image of a specific product by ID or SKU.
 */
export function updateProductImage(productIdOrSku: string, newImageUrl: string): StoredProduct | null {
  const current = getStoredProducts();
  let updatedProduct: StoredProduct | null = null;

  const updated = current.map((p) => {
    if (p.id === productIdOrSku || p.sku.toUpperCase() === productIdOrSku.toUpperCase()) {
      updatedProduct = { ...p, image: newImageUrl };
      return updatedProduct;
    }
    return p;
  });

  if (updatedProduct) {
    saveStoredProducts(updated);
  }

  return updatedProduct;
}

/**
 * Update stock level for a product.
 */
export function updateProductStock(productId: string, newStock: number): StoredProduct | null {
  const current = getStoredProducts();
  let updatedProduct: StoredProduct | null = null;

  const updated = current.map((p) => {
    if (p.id === productId) {
      updatedProduct = { ...p, stock: newStock };
      return updatedProduct;
    }
    return p;
  });

  if (updatedProduct) {
    saveStoredProducts(updated);
  }

  return updatedProduct;
}
