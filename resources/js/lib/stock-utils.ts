/**
 * Stock status utilities for color coding
 */

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockStatusInfo {
    status: StockStatus;
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
}

/**
 * Get stock status based on stock level
 */
export function getStockStatus(stock: number): StockStatus {
    if (stock === 0) return 'out_of_stock';
    if (stock <= 10) return 'low_stock';
    return 'in_stock';
}

/**
 * Get stock status info with colors and labels
 */
export function getStockStatusInfo(stock: number): StockStatusInfo {
    const status = getStockStatus(stock);
    
    switch (status) {
        case 'in_stock':
            return {
                status: 'in_stock',
                label: 'In Stock',
                color: 'green',
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
            };
        case 'low_stock':
            return {
                status: 'low_stock',
                label: 'Low Stock',
                color: 'orange',
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-700',
            };
        case 'out_of_stock':
            return {
                status: 'out_of_stock',
                label: 'Out of Stock',
                color: 'red',
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
            };
    }
}

/**
 * Get total stock for variants
 */
export function getTotalStock(variants: Array<{ stock: number }>): number {
    return variants.reduce((sum, variant) => sum + variant.stock, 0);
}

/**
 * Get overall stock status for a product based on all variants
 */
export function getProductStockStatus(variants: Array<{ stock: number }>): StockStatus {
    const totalStock = getTotalStock(variants);
    if (totalStock === 0) return 'out_of_stock';
    
    const lowStockVariants = variants.filter(v => v.stock > 0 && v.stock <= 10).length;
    if (lowStockVariants > 0 || totalStock <= 10) return 'low_stock';
    
    return 'in_stock';
}

