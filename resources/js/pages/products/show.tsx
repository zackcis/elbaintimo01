/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy as destroyProductImage } from '@/routes/products/images';
import { index as products, show as productShow } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Package,
    Tag,
    DollarSign,
    Box,
    ArrowLeft,
    ShoppingBag,
    ChevronRight,
    ChevronLeft,
    Star,
    X,
    GripVertical,
} from 'lucide-react';
import { getStockStatusInfo } from '@/lib/stock-utils';
import { getColorHex, isLightColor } from '@/lib/color-utils';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { useUi } from '@/hooks/use-ui';

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
    logo: string | null;
}

interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
    position: number;
}

interface ProductVariant {
    id: number;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    price: string;
    stock: number;
}

interface Product {
    id: number;
    title: string;
    description: string | null;
    category: Category;
    brand: Brand | null;
    tissu: string | null;
    variants: ProductVariant[];
    images: ProductImage[];
    created_at: string;
    updated_at: string;
}

interface ProductsShowProps {
    product: Product;
    relatedProducts: Product[];
}

function initialImageIndex(images: ProductImage[]): number {
    const sorted = [...images].sort((a, b) => a.position - b.position);
    const primaryIdx = sorted.findIndex((img) => img.is_primary);
    return primaryIdx >= 0 ? primaryIdx : 0;
}

export default function ProductsShow({ product, relatedProducts }: ProductsShowProps) {
    const toast = useToast();
    const { t, locale } = useUi();
    const ts = useCallback(
        (key: string) => {
            const translated = t(key);
            if (translated !== key) {
                return translated;
            }

            const fallbacks: Record<string, { it: string; en: string }> = {
                'products.show.not_available': { it: 'N/D', en: 'N/A' },
                'products.show.image_order_demo': {
                    it: 'Ordine immagini aggiornato (modalita demo - modifiche non salvate)',
                    en: 'Image order updated (demo mode - changes not saved)',
                },
                'products.show.confirm_delete_image': {
                    it: 'Sei sicuro di voler eliminare questa immagine?',
                    en: 'Are you sure you want to delete this image?',
                },
                'products.show.image_deleted_success': {
                    it: 'Immagine eliminata con successo.',
                    en: 'Image deleted successfully.',
                },
                'products.show.back_to_products': { it: 'Torna ai prodotti', en: 'Back to products' },
                'products.show.primary': { it: 'Principale', en: 'Primary' },
                'products.show.previous_image': { it: 'Immagine precedente', en: 'Previous image' },
                'products.show.next_image': { it: 'Immagine successiva', en: 'Next image' },
                'products.show.go_to_image': { it: "Vai all'immagine", en: 'Go to image' },
                'products.show.thumbnail': { it: 'Miniatura', en: 'Thumbnail' },
                'products.show.delete_image': { it: 'Elimina immagine', en: 'Delete image' },
                'products.show.description': { it: 'Descrizione', en: 'Description' },
                'products.show.price': { it: 'Prezzo', en: 'Price' },
                'products.show.stock': { it: 'Scorte', en: 'Stock' },
                'products.show.available_variants': { it: 'Varianti disponibili', en: 'Available variants' },
                'products.show.size': { it: 'Taglia', en: 'Size' },
                'products.show.color': { it: 'Colore', en: 'Color' },
                'products.show.variants': { it: 'varianti', en: 'variants' },
                'products.show.no_variants_match': {
                    it: 'Nessuna variante corrisponde ai filtri selezionati',
                    en: 'No variants match the selected filters',
                },
                'products.show.units': { it: 'unita', en: 'units' },
                'products.show.more_from': { it: 'Altri prodotti di', en: 'More from' },
                'products.show.discover_more_brand': {
                    it: 'Scopri altri prodotti di questo marchio',
                    en: 'Discover other products from this brand',
                },
                'products.show.stock_status.in_stock': { it: 'Disponibile', en: 'In stock' },
                'products.show.stock_status.low_stock': { it: 'Scorte basse', en: 'Low stock' },
                'products.show.stock_status.out_of_stock': { it: 'Esaurito', en: 'Out of stock' },
            };

            return fallbacks[key]?.[locale === 'it' ? 'it' : 'en'] ?? key;
        },
        [locale, t],
    );
    const [selectedImageIndex, setSelectedImageIndex] = useState(() =>
        initialImageIndex(product.images),
    );
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [hoveredImageId, setHoveredImageId] = useState<number | null>(null);

    const getPrimaryImage = (images: ProductImage[]) => {
        const primary = images.find((img) => img.is_primary);
        return primary || images[0] || null;
    };

    const getPriceRange = (variants: ProductVariant[]) => {
        if (variants.length === 0) return ts('products.show.not_available');
        const prices = variants.map((v) => parseFloat(v.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
            ? `${min.toFixed(2)} €`
            : `${min.toFixed(2)} € - ${max.toFixed(2)} €`;
    };

    const getTotalStock = (variants: ProductVariant[]) => {
        return variants.reduce((sum, variant) => sum + variant.stock, 0);
    };

    const priceRange = getPriceRange(product.variants);
    const totalStock = getTotalStock(product.variants);
    const stockInfo = getStockStatusInfo(totalStock);
    const stockStatusLabel = ts(`products.show.stock_status.${stockInfo.status}`);

    // Get unique sizes and colors
    const sizes = Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))) as string[];
    const colorOptions = Array.from(
        new Map(
            product.variants
                .map((variant) => {
                    const label = (variant.color ?? variant.color_hex ?? '').trim();
                    if (label === '') {
                        return null;
                    }

                    return [
                        label,
                        {
                            label,
                            hex: variant.color_hex || getColorHex(variant.color),
                        },
                    ] as const;
                })
                .filter((entry): entry is readonly [string, { label: string; hex: string }] => entry !== null),
        ).values(),
    );

    // Get filtered variants based on selection
    const filteredVariants = product.variants.filter(v => {
        if (selectedSize && v.size !== selectedSize) return false;
        if (selectedColor && (v.color ?? v.color_hex ?? null) !== selectedColor) return false;
        return true;
    });

    // Sort images by position
    const [sortedImages, setSortedImages] = useState(
        [...product.images].sort((a, b) => a.position - b.position),
    );
    const carouselRef = useRef<HTMLDivElement>(null);

    const imageIdsKey = sortedImages.map((i) => i.id).join(',');

    const scrollCarouselToIndex = useCallback(
        (index: number, behavior: ScrollBehavior = 'smooth') => {
            const el = carouselRef.current;
            if (!el || sortedImages.length === 0) return;
            const clamped = Math.max(0, Math.min(index, sortedImages.length - 1));
            const w = el.clientWidth;
            if (w <= 0) return;
            el.scrollTo({ left: clamped * w, behavior });
        },
        [sortedImages.length],
    );

    const syncIndexFromScroll = useCallback(() => {
        const el = carouselRef.current;
        if (!el || sortedImages.length === 0) return;
        const w = el.clientWidth;
        if (w <= 0) return;
        const i = Math.round(el.scrollLeft / w);
        const clamped = Math.max(0, Math.min(i, sortedImages.length - 1));
        setSelectedImageIndex((prev) => (prev === clamped ? prev : clamped));
    }, [sortedImages.length]);

    // After mount or when images list changes: clamp index and snap scroll (does not run on swipe-only index changes).
    useLayoutEffect(() => {
        const el = carouselRef.current;
        if (!el || sortedImages.length === 0) return;
        const w = el.clientWidth;
        if (w <= 0) return;
        setSelectedImageIndex((idx) => {
            const next = Math.max(0, Math.min(idx, sortedImages.length - 1));
            el.scrollLeft = next * w;
            return next;
        });
    }, [imageIdsKey, sortedImages.length]);

    // Handle drag and drop reordering (UI only - visual feedback)
    const handleDragStart = (index: number) => {
        setDraggedImageIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedImageIndex === null || draggedImageIndex === index) return;

        const newImages = [...sortedImages];
        const draggedImage = newImages[draggedImageIndex];
        newImages.splice(draggedImageIndex, 1);
        newImages.splice(index, 0, draggedImage);
        setSortedImages(newImages);
        setDraggedImageIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedImageIndex(null);
        // In a real implementation, you would save the new order to the backend
        toast.info(ts('products.show.image_order_demo'));
    };

    const handleDeleteImage = (imageId: number) => {
        if (confirm(ts('products.show.confirm_delete_image'))) {
            router.delete(destroyProductImage.url({ product: product.id, productImage: imageId }), {
                onSuccess: () => {
                    toast.success(ts('products.show.image_deleted_success'));
                    setSortedImages((prev) => {
                        const next = prev.filter((img) => img.id !== imageId);
                        setSelectedImageIndex((i) =>
                            Math.max(0, Math.min(i, Math.max(0, next.length - 1))),
                        );
                        return next;
                    });
                },
            });
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('nav.dashboard'),
            href: dashboard().url,
        },
        {
            title: t('nav.products'),
            href: products().url,
        },
        {
            title: product.title,
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${product.title} - HARIMI`} />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <div className="flex min-w-0 h-full flex-1 flex-col gap-8 p-6 bg-beige-light">
                {/* Back Button */}
                <Link
                    href={products().url}
                    className="inline-flex items-center gap-2 text-burgundy hover:text-burgundy-dark font-sans uppercase tracking-wide text-sm transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {ts('products.show.back_to_products')}
                </Link>

                {/* Product Details */}
                <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-start">
                    {/* Product Image Gallery */}
                    <div className="min-w-0 space-y-4">
                        {/* Image carousel: swipe / scroll-snap + arrows + dots */}
                        <Card className="overflow-hidden border-gray-200 shadow-sm rounded-lg">
                            <div className="relative bg-beige">
                                {sortedImages.length > 0 ? (
                                    <>
                                        <div
                                            ref={carouselRef}
                                            onScroll={() => {
                                                requestAnimationFrame(syncIndexFromScroll);
                                            }}
                                            className="flex aspect-[3/4] w-full touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            {sortedImages.map((image, index) => (
                                                <div
                                                    key={image.id}
                                                    className="relative h-full min-h-0 w-full min-w-full shrink-0 snap-center snap-always"
                                                >
                                                    <img
                                                        src={`/storage/${image.path}`}
                                                        alt={`${product.title} — ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                        draggable={false}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const placeholder =
                                                                target.parentElement?.querySelector(
                                                                    '.carousel-slide-placeholder',
                                                                );
                                                            if (placeholder) {
                                                                (placeholder as HTMLElement).style.display =
                                                                    'flex';
                                                            }
                                                        }}
                                                    />
                                                    <div
                                                        className="carousel-slide-placeholder absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-beige to-beige-light"
                                                    >
                                                        <Package className="h-32 w-32 text-gray-300" />
                                                    </div>
                                                    {image.is_primary && (
                                                        <Badge className="absolute top-3 left-3 z-10 bg-burgundy font-sans text-xs uppercase tracking-wide text-white border-0">
                                                            {ts('products.show.primary')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {sortedImages.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    aria-label={ts('products.show.previous_image')}
                                                    onClick={() => {
                                                        const i = Math.max(0, selectedImageIndex - 1);
                                                        setSelectedImageIndex(i);
                                                        scrollCarouselToIndex(i);
                                                    }}
                                                    disabled={selectedImageIndex <= 0}
                                                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2 text-burgundy shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={ts('products.show.next_image')}
                                                    onClick={() => {
                                                        const i = Math.min(
                                                            sortedImages.length - 1,
                                                            selectedImageIndex + 1,
                                                        );
                                                        setSelectedImageIndex(i);
                                                        scrollCarouselToIndex(i);
                                                    }}
                                                    disabled={
                                                        selectedImageIndex >= sortedImages.length - 1
                                                    }
                                                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2 text-burgundy shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </button>
                                                <div
                                                    className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4"
                                                    aria-hidden
                                                >
                                                    <div className="pointer-events-auto flex flex-wrap justify-center gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur-sm">
                                                        {sortedImages.map((_, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                aria-label={`${ts('products.show.go_to_image')} ${i + 1}`}
                                                                aria-current={
                                                                    i === selectedImageIndex ? 'true' : undefined
                                                                }
                                                                onClick={() => {
                                                                    setSelectedImageIndex(i);
                                                                    scrollCarouselToIndex(i);
                                                                }}
                                                                className={`h-2.5 w-2.5 rounded-full transition ${
                                                                    i === selectedImageIndex
                                                                        ? 'scale-125 bg-white'
                                                                        : 'bg-white/50 hover:bg-white/80'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-beige to-beige-light">
                                        <Package className="h-32 w-32 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Thumbnail Gallery with Drag & Drop */}
                        {sortedImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {sortedImages.map((image, index) => (
                                    <div
                                        key={image.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onMouseEnter={() => setHoveredImageId(image.id)}
                                        onMouseLeave={() => setHoveredImageId(null)}
                                        className={`relative flex-shrink-0 group/thumb ${
                                            draggedImageIndex === index ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedImageIndex(index);
                                                scrollCarouselToIndex(index);
                                            }}
                                            className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all relative ${
                                                selectedImageIndex === index
                                                    ? 'border-burgundy ring-2 ring-burgundy/20'
                                                    : 'border-gray-200 hover:border-border'
                                            }`}
                                        >
                                        {image.path ? (
                                            <img
                                                src={`/storage/${image.path}`}
                                                alt={`${ts('products.show.thumbnail')} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const placeholder = target.parentElement?.querySelector('.thumb-placeholder');
                                                    if (placeholder) {
                                                        (placeholder as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className="thumb-placeholder w-full h-full bg-beige flex items-center justify-center" style={{ display: image.path ? 'none' : 'flex' }}>
                                            <Package className="h-8 w-8 text-gray-300" />
                                        </div>
                                            
                                            {/* Primary Badge */}
                                            {image.is_primary && (
                                                <Badge className="absolute top-1 left-1 bg-burgundy text-white text-[10px] px-1 py-0 border-0">
                                                    P
                                                </Badge>
                                            )}

                                            {/* Delete Button on Hover */}
                                            {hoveredImageId === image.id && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(image.id);
                                                    }}
                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all z-10"
                                                    title={ts('products.show.delete_image')}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}

                                            {/* Drag Handle */}
                                            <div className="absolute bottom-1 right-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                <GripVertical className="h-3 w-3 text-gray-400" />
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {/* Single Image Delete */}
                        {sortedImages.length === 1 && (
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteImage(sortedImages[0].id)}
                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 font-sans uppercase tracking-wide text-xs"
                                >
                                    <X className="h-3 w-3 mr-2" />
                                    {ts('products.show.delete_image')}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="min-w-0 max-w-full space-y-6">
                        {/* Trail (compact; avoids competing with app header breadcrumbs) */}
                        <nav
                            className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-xs font-medium text-gray-500 sm:text-sm"
                            aria-label="Breadcrumb"
                        >
                            <Link href={dashboard().url} className="hover:text-burgundy">
                                {t('nav.dashboard')}
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                            <Link href={products().url} className="hover:text-burgundy">
                                {t('nav.products')}
                            </Link>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                            <span className="truncate text-burgundy">{product.category.name}</span>
                        </nav>

                        <div className="min-w-0 space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                <h1 className="min-w-0 max-w-full text-3xl font-semibold tracking-tight text-burgundy sm:text-4xl break-words font-sans">
                                    {product.title}
                                </h1>
                                {product.brand && (
                                    <Badge className="w-fit shrink-0 border-0 bg-gray-900 px-3 py-1.5 font-sans text-xs font-medium uppercase tracking-wide text-white sm:mt-1">
                                        {product.brand.name}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-600">
                                    <Tag className="h-3.5 w-3.5 text-burgundy" aria-hidden />
                                    <span className="truncate">{product.category.name}</span>
                                </div>
                                {product.tissu && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200/90 bg-white/70 px-3 py-1 text-xs font-medium tracking-wide text-gray-600">
                                        <ShoppingBag className="h-3.5 w-3.5 text-burgundy" aria-hidden />
                                        <span className="truncate">{product.tissu}</span>
                                    </div>
                                )}
                            </div>
                            {product.description && (
                                <div className="min-w-0 rounded-lg border border-gray-200/90 bg-white/90 px-4 py-3 shadow-sm">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {ts('products.show.description')}
                                    </p>
                                    <div
                                        className="max-w-full text-[15px] leading-relaxed text-gray-700 font-sans whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:break-word] hyphens-auto"
                                    >
                                        {product.description}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Price and Stock */}
                        <div className="grid grid-cols-1 gap-3 border-t border-gray-200/90 pt-4 sm:grid-cols-2">
                            <div className="flex min-w-0 items-stretch gap-3 rounded-lg border border-gray-200/90 bg-white/80 px-4 py-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                                    <DollarSign className="h-5 w-5" aria-hidden />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {ts('products.show.price')}
                                    </p>
                                    <p className="truncate text-xl font-semibold tabular-nums tracking-tight text-burgundy">
                                        {priceRange}
                                    </p>
                                </div>
                            </div>
                            <div className="flex min-w-0 items-stretch gap-3 rounded-lg border border-gray-200/90 bg-white/80 px-4 py-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
                                    <Box className="h-5 w-5" aria-hidden />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        {ts('products.show.stock')}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p
                                            className="text-xl font-semibold tabular-nums"
                                            style={{
                                                color:
                                                    stockInfo.color === 'green'
                                                        ? '#16a34a'
                                                        : stockInfo.color === 'orange'
                                                          ? '#ea580c'
                                                          : '#dc2626',
                                            }}
                                        >
                                            {totalStock}
                                        </p>
                                        <Badge
                                            className={`${stockInfo.bgColor} ${stockInfo.textColor} border-0 font-sans text-xs`}
                                        >
                                            {stockStatusLabel}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Variants Section */}
                        <div className="space-y-5 border-t border-gray-200/90 pt-4">
                            <h3 className="text-lg font-semibold tracking-tight text-burgundy font-sans">
                                {ts('products.show.available_variants')}
                            </h3>

                            {/* Size Selection */}
                            {sizes.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 font-sans">
                                        {ts('products.show.size')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {sizes.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedSize(selectedSize === size ? null : size);
                                                }}
                                                className={`min-w-[2.75rem] shrink-0 rounded-md border-2 px-4 py-2 text-center font-sans text-sm font-medium uppercase tracking-wide transition-all ${
                                                    selectedSize === size
                                                        ? 'border-burgundy bg-burgundy text-white shadow-sm'
                                                        : 'border-gray-200 bg-white text-gray-800 hover:border-burgundy/40 hover:bg-beige-light/80'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Color Selection */}
                            {colorOptions.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700 font-sans">
                                        {ts('products.show.color')}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {colorOptions.map((colorOption) => {
                                            const colorHex = colorOption.hex;
                                            const isLight = isLightColor(colorHex);
                                            return (
                                                <button
                                                    key={colorOption.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedColor(
                                                            selectedColor === colorOption.label ? null : colorOption.label,
                                                        );
                                                    }}
                                                    className={`relative h-11 w-11 shrink-0 rounded-full border-2 shadow-sm ring-1 ring-black/5 transition-all ${
                                                        selectedColor === colorOption.label
                                                            ? 'scale-105 border-burgundy ring-2 ring-burgundy/35'
                                                            : 'border-gray-300 hover:border-gray-500'
                                                    }`}
                                                    style={{ backgroundColor: colorHex }}
                                                    title={colorOption.label}
                                                >
                                                    {selectedColor === colorOption.label && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Star className={`h-5 w-5 ${isLight ? 'text-gray-800' : 'text-white'}`} fill="currentColor" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Variant List */}
                            <div>
                                <p className="text-sm font-sans font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                    {ts('products.show.variants')} ({filteredVariants.length})
                                </p>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {filteredVariants.length === 0 ? (
                                        <p className="text-sm text-gray-500 font-sans text-center py-4">
                                            {ts('products.show.no_variants_match')}
                                        </p>
                                    ) : (
                                        filteredVariants.map((variant) => {
                                            const variantStockInfo = getStockStatusInfo(variant.stock);
                                            return (
                                                <div
                                                    key={variant.id}
                                                    className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-white p-3 transition-colors hover:border-burgundy/40"
                                                >
                                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                                                        {variant.size && (
                                                            <Badge variant="outline" className="font-sans text-xs">
                                                                {variant.size}
                                                            </Badge>
                                                        )}
                                                        {variant.color && (
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-4 h-4 rounded-full border border-border"
                                                                    style={{ backgroundColor: getColorHex(variant.color) }}
                                                                />
                                                                <span className="min-w-0 max-w-full text-xs text-gray-600 font-sans [overflow-wrap:anywhere] [word-break:break-word]">
                                                                    {variant.color}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-serif font-semibold text-burgundy">
                                                            {parseFloat(variant.price).toFixed(2)} €
                                                        </span>
                                                        <Badge className={`${variantStockInfo.bgColor} ${variantStockInfo.textColor} border-0 font-sans text-xs`}>
                                                            {variant.stock} {ts('products.show.units')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* More from this brand */}
                {product.brand && relatedProducts.length > 0 && (
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-serif font-bold tracking-tight text-burgundy mb-2">
                                    {ts('products.show.more_from')} {product.brand.name}
                                </h2>
                                <p className="text-sm text-gray-600 font-sans">
                                    {ts('products.show.discover_more_brand')}
                                </p>
                            </div>
                            <ShoppingBag className="h-8 w-8 text-burgundy" />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {relatedProducts.map((relatedProduct) => {
                                const relatedPrimaryImage = getPrimaryImage(
                                    relatedProduct.images,
                                );
                                const relatedPriceRange = getPriceRange(
                                    relatedProduct.variants,
                                );

                                return (
                                    <Link
                                        key={relatedProduct.id}
                                        href={productShow({ product: relatedProduct.id }).url}
                                    >
                                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-150 border-gray-200 rounded-lg group cursor-pointer">
                                            <div className="aspect-[3/4] bg-beige relative overflow-hidden">
                                                {relatedPrimaryImage ? (
                                                    <>
                                                        <img
                                                            src={`/storage/${relatedPrimaryImage.path}`}
                                                            alt={relatedProduct.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const placeholder = target.parentElement?.querySelector('.related-placeholder');
                                                                if (placeholder) {
                                                                    (placeholder as HTMLElement).style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                        <div className="related-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige to-beige-light" style={{ display: 'none' }}>
                                                            <Package className="h-16 w-16 text-gray-300" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige to-beige-light">
                                                        <Package className="h-16 w-16 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <CardHeader className="bg-white">
                                                <CardTitle className="text-base font-serif font-bold line-clamp-2 text-burgundy group-hover:text-burgundy-dark transition-colors duration-150">
                                                    {relatedProduct.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-sans mt-2">
                                                    <Tag className="h-3 w-3" />
                                                    <span className="uppercase tracking-wide">
                                                        {relatedProduct.category.name}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="bg-white">
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <span className="font-serif font-semibold text-burgundy text-sm">
                                                        {relatedPriceRange}
                                                    </span>
                                                    <Badge className="bg-burgundy text-white font-sans text-xs uppercase tracking-wide border-0">
                                                        {relatedProduct.variants.length}{' '}
                                                        {ts('products.show.variants')}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}




