export const COLOR_HEX_REGEX = /^#([A-Fa-f0-9]{6})$/;

export type BrandMode = 'existing' | 'new';

/** Shared: titles, category, optional new-brand fields (create + edit). */
export function validateProductBasics(formData: FormData, mode: BrandMode): Record<string, string> {
    const out: Record<string, string> = {};

    const titleIt = String(formData.get('title[it]') ?? '').trim();
    const titleEn = String(formData.get('title[en]') ?? '').trim();
    if (!titleIt) {
        out['title.it'] = 'Italian title is required.';
    }
    if (!titleEn) {
        out['title.en'] = 'English title is required.';
    }

    const categoryId = String(formData.get('category_id') ?? '').trim();
    if (!categoryId) {
        out.category_id = 'Please select a category.';
    }

    if (mode === 'new') {
        const nit = String(formData.get('new_brand_name[it]') ?? '').trim();
        const nen = String(formData.get('new_brand_name[en]') ?? '').trim();
        if (!nit) {
            out['new_brand_name.it'] = 'Italian brand name is required when adding a new brand.';
        }
        if (!nen) {
            out['new_brand_name.en'] = 'English brand name is required when adding a new brand.';
        }
    }

    return out;
}

export interface VariantFormRow {
    size: string;
    color: string;
    color_hex: string;
    price: string;
    compare_at_price?: string;
    stock: string;
}

/**
 * Client-side checks for variant rows (keys match Laravel: variants.0.color, etc.).
 */
export function validateVariantRows(variantRows: VariantFormRow[]): Record<string, string> {
    const out: Record<string, string> = {};

    if (variantRows.length < 1) {
        out.variants = 'Add at least one product variant.';
    }

    variantRows.forEach((v, i) => {
        const colorName = String(v.color ?? '').trim();
        if (!colorName) {
            out[`variants.${i}.color`] = 'Color name is required for every variant (e.g. Black, Burgundy).';
        }

        const priceRaw = String(v.price ?? '').trim();
        let priceNum: number | null = null;
        if (priceRaw === '') {
            out[`variants.${i}.price`] = 'Price is required.';
        } else {
            const n = Number(priceRaw);
            if (!Number.isFinite(n)) {
                out[`variants.${i}.price`] = 'Price must be a valid number.';
            } else if (n < 0 || n > 999_999.99) {
                out[`variants.${i}.price`] = 'Price must be between 0 and 999999.99.';
            } else {
                priceNum = n;
            }
        }

        const compareRaw = String(v.compare_at_price ?? '').trim();
        if (compareRaw !== '') {
            const c = Number(compareRaw);
            if (!Number.isFinite(c)) {
                out[`variants.${i}.compare_at_price`] = 'Was price must be a valid number.';
            } else if (c < 0 || c > 999_999.99) {
                out[`variants.${i}.compare_at_price`] = 'Was price must be between 0 and 999999.99.';
            } else if (priceNum !== null && c <= priceNum) {
                out[`variants.${i}.compare_at_price`] =
                    'Was price must be higher than the selling price to show a discount.';
            }
        }

        const stockRaw = String(v.stock ?? '').trim();
        if (stockRaw === '') {
            out[`variants.${i}.stock`] = 'Stock is required.';
        } else if (!/^-?\d+$/.test(stockRaw)) {
            out[`variants.${i}.stock`] = 'Stock must be a whole number (no decimals).';
        } else {
            const s = parseInt(stockRaw, 10);
            if (s < 0) {
                out[`variants.${i}.stock`] = 'Stock cannot be negative.';
            }
        }

        const hex = String(v.color_hex ?? '').trim();
        if (!hex) {
            out[`variants.${i}.color_hex`] =
                'Color hex is required. Use # followed by exactly 6 hexadecimal digits (example: #1A2B3C).';
        } else if (!COLOR_HEX_REGEX.test(hex)) {
            out[`variants.${i}.color_hex`] =
                'Color hex must be exactly # plus 6 hexadecimal digits (example: #1A2B3C). Invalid values are not allowed.';
        }
    });

    return out;
}
