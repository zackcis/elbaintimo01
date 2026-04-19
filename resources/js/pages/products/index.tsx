/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as productsIndex } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, Tag, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { getStockStatusInfo, getTotalStock } from '@/lib/stock-utils';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
import { EmptyState } from '@/components/empty-state';
import { ResourceViewSwitcher } from '@/components/resource-view-switcher';
import { useResourceViewMode } from '@/hooks/use-resource-view-mode';
import { cn } from '@/lib/utils';
import type { ResourceViewMode } from '@/lib/resource-view';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: productsIndex().url,
    },
];

interface Category {
    id: number;
    name: string;
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
    price: string;
    stock: number;
}

interface Brand {
    id: number;
    name: string;
    logo: string | null;
}

interface Product {
    id: number;
    title: string;
    description: string | null;
    category: Category;
    brand: Brand | null;
    variants: ProductVariant[];
    images: ProductImage[];
    created_at: string;
    updated_at: string;
}

interface ProductsData {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface FilterEntity {
    id: number;
    name: string;
}

interface ProductFilters {
    brand_id: number | null;
    category_id: number | null;
    brand: FilterEntity | null;
    category: FilterEntity | null;
}

interface ProductsProps {
    products: ProductsData;
    filters?: ProductFilters;
}

function productGridClass(mode: ResourceViewMode): string {
    switch (mode) {
        case 'large-icons':
            return 'grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        case 'small-icons':
            return 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
        case 'medium-icons':
        default:
            return 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
}

export default function ProductsIndex({ products, filters }: ProductsProps) {
    const page = usePage();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: number | null }>({
        open: false,
        productId: null,
    });
    const { mode: viewMode, setMode: setViewMode } = useResourceViewMode('harimi-products-view');

    // Demo loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, [filters?.brand_id, filters?.category_id]);

    // Show success message if redirected with success
    const flash = (page.props as { flash?: { success?: string } }).flash;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    const getPrimaryImage = (images: ProductImage[]) => {
        const primary = images.find((img) => img.is_primary);
        return primary || images[0] || null;
    };

    const getPriceRange = (variants: ProductVariant[]) => {
        if (variants.length === 0) return 'N/A';
        const prices = variants.map((v) => parseFloat(v.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max
            ? `$${min.toFixed(2)}`
            : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
    };

    const handleDelete = (productId: number) => {
        setDeleteDialog({ open: true, productId });
    };

    const confirmDelete = () => {
        if (deleteDialog.productId) {
            router.delete(`/products/${deleteDialog.productId}`, {
                onSuccess: () => {
                    toast.success('Product deleted successfully.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products - HARIMI" />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, productId: null })}
                onConfirm={confirmDelete}
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-beige/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="font-serif text-3xl font-semibold text-foreground mb-1">
                            Produits
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {products.total} produit{products.total !== 1 ? 's' : ''}
                            {filters?.brand_id || filters?.category_id ? ' (filtrés)' : ' au total'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <ResourceViewSwitcher mode={viewMode} onChange={setViewMode} />
                        <Link href="/products/create" className="inline-flex">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nouveau produit
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <ProductListSkeleton count={6} />
                ) : products.data.length === 0 ? (
                    <Card className="border-gray-200">
                        <CardContent>
                            <EmptyState
                                icon={Package}
                                title="Aucun produit"
                                description={
                                    filters?.brand_id || filters?.category_id
                                        ? 'Aucun produit ne correspond à ces filtres. Modifiez la marque ou la catégorie, ou réinitialisez les filtres.'
                                        : 'Aucun produit pour le moment. Créez votre premier produit pour commencer à gérer votre catalogue.'
                                }
                                actionLabel={
                                    filters?.brand_id || filters?.category_id
                                        ? 'Voir tous les produits'
                                        : 'Créer un produit'
                                }
                                actionHref={
                                    filters?.brand_id || filters?.category_id
                                        ? productsIndex().url
                                        : '/products/create'
                                }
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {(filters?.brand || filters?.category) && (
                            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-white px-4 py-3 shadow-sm">
                                <span className="text-sm font-medium text-muted-foreground">Filtres actifs :</span>
                                {filters.brand && (
                                    <Badge variant="secondary" className="gap-1.5 pl-2 pr-1 py-1 font-sans">
                                        <Tag className="h-3 w-3" />
                                        Marque : {filters.brand.name}
                                    </Badge>
                                )}
                                {filters.category && (
                                    <Badge variant="secondary" className="gap-1.5 pl-2 pr-1 py-1 font-sans">
                                        <Package className="h-3 w-3" />
                                        Catégorie : {filters.category.name}
                                    </Badge>
                                )}
                                <Link href={productsIndex().url} className="ml-auto inline-flex">
                                    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                                        <X className="h-3.5 w-3.5" />
                                        Réinitialiser
                                    </Button>
                                </Link>
                            </div>
                        )}
                        {viewMode === 'details' ? (
                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-white shadow-sm">
                                <table className="w-full min-w-[880px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            <th className="px-3 py-3 w-20"> </th>
                                            <th className="px-3 py-3">Produit</th>
                                            <th className="px-3 py-3">Catégorie</th>
                                            <th className="px-3 py-3">Marque</th>
                                            <th className="px-3 py-3 text-right">Variantes</th>
                                            <th className="px-3 py-3 text-right">Prix</th>
                                            <th className="px-3 py-3 text-right">Stock</th>
                                            <th className="px-3 py-3">État</th>
                                            <th className="px-3 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.data.map((product) => {
                                            const primaryImage = getPrimaryImage(product.images);
                                            const priceRange = getPriceRange(product.variants);
                                            const totalStock = getTotalStock(product.variants);
                                            const stockInfo = getStockStatusInfo(totalStock);
                                            return (
                                                <tr
                                                    key={product.id}
                                                    className="border-b border-border/60 transition-colors hover:bg-muted/30"
                                                >
                                                    <td className="px-3 py-2 align-middle">
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="relative block h-14 w-14 overflow-hidden rounded-lg bg-beige"
                                                        >
                                                            {primaryImage ? (
                                                                <img
                                                                    src={`/storage/${primaryImage.path}`}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="flex h-full w-full items-center justify-center">
                                                                    <Package className="h-6 w-6 text-gray-300" />
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-2 align-middle font-medium text-foreground">
                                                        <Link
                                                            href={`/products/${product.id}`}
                                                            className="hover:text-burgundy hover:underline"
                                                        >
                                                            {product.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-2 align-middle text-muted-foreground">
                                                        {product.category.name}
                                                    </td>
                                                    <td className="px-3 py-2 align-middle text-muted-foreground">
                                                        {product.brand?.name ?? '—'}
                                                    </td>
                                                    <td className="px-3 py-2 align-middle text-right tabular-nums">
                                                        {product.variants.length}
                                                    </td>
                                                    <td className="px-3 py-2 align-middle text-right font-medium tabular-nums">
                                                        {priceRange}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            'px-3 py-2 align-middle text-right font-semibold tabular-nums',
                                                            stockInfo.textColor,
                                                        )}
                                                    >
                                                        {totalStock}
                                                    </td>
                                                    <td className="px-3 py-2 align-middle">
                                                        <Badge
                                                            className={`${stockInfo.bgColor} ${stockInfo.textColor} border-0 text-[10px] font-semibold uppercase`}
                                                        >
                                                            {stockInfo.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-3 py-2 align-middle text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Link href={`/products/${product.id}`}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/products/${product.id}/edit`}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(product.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="flex flex-col gap-2">
                                {products.data.map((product) => {
                                    const primaryImage = getPrimaryImage(product.images);
                                    const priceRange = getPriceRange(product.variants);
                                    const totalStock = getTotalStock(product.variants);
                                    const stockInfo = getStockStatusInfo(totalStock);
                                    return (
                                        <div
                                            key={product.id}
                                            className="flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            <Link
                                                href={`/products/${product.id}`}
                                                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-beige"
                                            >
                                                {primaryImage ? (
                                                    <img
                                                        src={`/storage/${primaryImage.path}`}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center">
                                                        <Package className="h-8 w-8 text-gray-300" />
                                                    </span>
                                                )}
                                            </Link>
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="font-semibold text-foreground hover:text-burgundy"
                                                >
                                                    {product.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.category.name}
                                                    {product.brand ? ` · ${product.brand.name}` : ''}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {product.variants.length} variantes
                                                    </Badge>
                                                    <Badge
                                                        className={`${stockInfo.bgColor} ${stockInfo.textColor} border-0 text-[10px]`}
                                                    >
                                                        {stockInfo.label}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1 text-right text-sm">
                                                <span className="font-semibold tabular-nums">{priceRange}</span>
                                                <span className={cn('tabular-nums font-medium', stockInfo.textColor)}>
                                                    Stock {totalStock}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <Link href={`/products/${product.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/products/${product.id}/edit`}>
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(product.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={productGridClass(viewMode)}>
                                {products.data.map((product) => {
                                    const primaryImage = getPrimaryImage(product.images);
                                    const priceRange = getPriceRange(product.variants);
                                    const totalStock = getTotalStock(product.variants);
                                    const stockInfo = getStockStatusInfo(totalStock);
                                    const density =
                                        viewMode === 'large-icons'
                                            ? 'lg'
                                            : viewMode === 'small-icons'
                                              ? 'sm'
                                              : 'md';
                                    const iconBox =
                                        density === 'lg'
                                            ? 'h-24 w-24'
                                            : density === 'sm'
                                              ? 'h-12 w-12'
                                              : 'h-20 w-20';

                                    return (
                                        <Card
                                            key={product.id}
                                            className={cn(
                                                'overflow-hidden rounded-2xl border-border/80 transition-all duration-200 group relative hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
                                                density === 'sm' && 'rounded-xl',
                                            )}
                                        >
                                            <div className="relative aspect-square bg-beige overflow-hidden">
                                                <Link href={`/products/${product.id}`}>
                                                    {primaryImage ? (
                                                        <>
                                                            <img
                                                                src={`/storage/${primaryImage.path}`}
                                                                alt={product.title}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.style.display = 'none';
                                                                    const placeholder =
                                                                        target.parentElement?.querySelector(
                                                                            '.product-placeholder',
                                                                        );
                                                                    if (placeholder) {
                                                                        (placeholder as HTMLElement).style.display =
                                                                            'flex';
                                                                    }
                                                                }}
                                                            />
                                                            <div
                                                                className="product-placeholder absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-beige to-beige-light"
                                                            >
                                                                <Package className={cn(iconBox, 'text-gray-300')} />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige to-beige-light">
                                                            <Package className={cn(iconBox, 'text-gray-300')} />
                                                        </div>
                                                    )}
                                                </Link>

                                                <div
                                                    className={cn(
                                                        'absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                                                        density === 'sm' && 'gap-1',
                                                    )}
                                                >
                                                    <Link href={`/products/${product.id}`}>
                                                        <Button
                                                            size="sm"
                                                            className={cn(
                                                                'bg-white font-sans uppercase tracking-wide text-burgundy hover:bg-burgundy hover:text-white',
                                                                density === 'sm' && 'h-7 px-2 text-[10px]',
                                                            )}
                                                        >
                                                            <Eye className={cn('mr-1', density === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
                                                            {density === 'sm' ? (
                                                                <span className="sr-only">View</span>
                                                            ) : (
                                                                'View'
                                                            )}
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/products/${product.id}/edit`}>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className={cn(
                                                                'border-burgundy bg-white/90 font-sans uppercase tracking-wide text-burgundy hover:bg-burgundy hover:text-white',
                                                                density === 'sm' && 'h-7 px-2 text-[10px]',
                                                            )}
                                                        >
                                                            <Edit className={cn(density === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
                                                            {density === 'sm' && <span className="sr-only">Edit</span>}
                                                        </Button>
                                                    </Link>
                                                </div>

                                                <div
                                                    className={cn(
                                                        'absolute right-2 top-2',
                                                        density === 'lg' && 'right-3 top-3',
                                                    )}
                                                >
                                                    <Badge
                                                        className={cn(
                                                            `${stockInfo.bgColor} ${stockInfo.textColor} border-0 font-sans font-semibold uppercase tracking-wide shadow-sm`,
                                                            density === 'sm'
                                                                ? 'px-1.5 py-0 text-[9px]'
                                                                : 'text-xs',
                                                        )}
                                                    >
                                                        {stockInfo.label}
                                                    </Badge>
                                                </div>

                                                {product.brand && (
                                                    <div
                                                        className={cn(
                                                            'absolute left-2 top-2',
                                                            density === 'lg' && 'left-3 top-3',
                                                        )}
                                                    >
                                                        <Badge
                                                            className={cn(
                                                                'border-0 bg-burgundy/90 font-sans uppercase tracking-wide text-white shadow-sm backdrop-blur-sm',
                                                                density === 'sm'
                                                                    ? 'px-1.5 py-0 text-[9px]'
                                                                    : 'text-xs',
                                                            )}
                                                        >
                                                            {product.brand.name}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader
                                                className={cn(density === 'sm' && 'space-y-0 p-3 pb-2 pt-2')}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <Link href={`/products/${product.id}`} className="min-w-0 flex-1">
                                                        <CardTitle
                                                            className={cn(
                                                                'line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-burgundy cursor-pointer',
                                                                density === 'lg' && 'text-lg',
                                                                density === 'md' && 'text-base',
                                                                density === 'sm' && 'text-xs leading-snug',
                                                            )}
                                                        >
                                                            {product.title}
                                                        </CardTitle>
                                                    </Link>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'shrink-0',
                                                            density === 'sm' ? 'text-[10px]' : 'text-xs',
                                                        )}
                                                    >
                                                        {product.variants.length}
                                                    </Badge>
                                                </div>
                                                <div className={cn('mt-2', density === 'sm' && 'mt-1')}>
                                                    <span
                                                        className={cn(
                                                            'text-muted-foreground',
                                                            density === 'sm' ? 'text-[10px] leading-tight' : 'text-xs',
                                                        )}
                                                    >
                                                        {product.category.name}
                                                        {product.brand ? ` · ${product.brand.name}` : ''}
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className={cn(density === 'sm' && 'p-3 pt-0')}>
                                                {product.description && density !== 'sm' && (
                                                    <p
                                                        className={cn(
                                                            'mb-4 line-clamp-2 text-gray-600',
                                                            density === 'lg' ? 'text-sm' : 'text-sm',
                                                        )}
                                                    >
                                                        {product.description}
                                                    </p>
                                                )}
                                                <div
                                                    className={cn(
                                                        'grid grid-cols-2 gap-4 border-t border-border pt-3',
                                                        density === 'sm' && 'gap-2 pt-2',
                                                    )}
                                                >
                                                    <div>
                                                        <p
                                                            className={cn(
                                                                'mb-1 text-muted-foreground',
                                                                density === 'sm' ? 'text-[10px]' : 'text-xs',
                                                            )}
                                                        >
                                                            Prix
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                'font-semibold text-foreground',
                                                                density === 'sm' ? 'text-xs' : 'text-sm',
                                                            )}
                                                        >
                                                            {priceRange}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p
                                                            className={cn(
                                                                'mb-1 text-muted-foreground',
                                                                density === 'sm' ? 'text-[10px]' : 'text-xs',
                                                            )}
                                                        >
                                                            Stock
                                                        </p>
                                                        <p
                                                            className={cn(
                                                                'font-semibold',
                                                                density === 'sm' ? 'text-xs' : 'text-sm',
                                                                stockInfo.textColor,
                                                            )}
                                                        >
                                                            {totalStock}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                {products.links.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={index}
                                                className="px-4 py-2 text-sm text-gray-500 font-sans"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-4 py-2 text-sm rounded-[10px] border transition-all duration-200 ${
                                                link.active
                                                    ? 'bg-burgundy text-white border-burgundy'
                                                    : 'border-border text-foreground hover:bg-burgundy hover:text-white hover:border-burgundy'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
