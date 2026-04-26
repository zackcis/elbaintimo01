/**
 * Color utility functions for color swatches
 */

/**
 * Convert color name to hex color (basic mapping)
 */
export function getColorHex(colorName: string | null): string {
    if (!colorName) return '#CCCCCC';
    if (/^#([A-Fa-f0-9]{6})$/.test(colorName.trim())) {
        return colorName.trim().toUpperCase();
    }
    
    const colorMap: Record<string, string> = {
        black: '#000000',
        white: '#FFFFFF',
        red: '#FF0000',
        blue: '#0000FF',
        green: '#008000',
        yellow: '#FFFF00',
        orange: '#FFA500',
        purple: '#800080',
        pink: '#FFC0CB',
        gray: '#808080',
        grey: '#808080',
        brown: '#A52A2A',
        navy: '#000080',
        khaki: '#C3B091',
        beige: '#F5F5DC',
        coral: '#FF7F50',
        burgundy: '#800020',
    };
    
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || `#${normalized.slice(0, 6).padEnd(6, '0')}`;
}

/**
 * Check if color is light (for determining text color)
 */
export function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
}

