/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as products } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Package, Tag, DollarSign, Box, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { getStockStatusInfo, getTotalStock, getProductStockStatus } from '@/lib/stock-utils';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
import { EmptyState } from '@/components/empty-state';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: products().url,
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

interface ProductsProps {
    products: ProductsData;
}

export default function ProductsIndex({ products }: ProductsProps) {
    const page = usePage();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: number | null }>({
        open: false,
        productId: null,
    });

    // Demo loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

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
            <Head title="Products - ElbaIntimo" />
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-semibold text-foreground mb-1">
                            Produits
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {products.total} produit{products.total !== 1 ? 's' : ''} au total
                        </p>
                    </div>
                    <Link href="/products/create" className="inline-flex">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouveau produit
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <ProductListSkeleton count={6} />
                ) : products.data.length === 0 ? (
                    <Card className="border-gray-200">
                        <CardContent>
                            <EmptyState
                                icon={Package}
                                title="Aucun produit"
                                description="Aucun produit pour le moment. Créez votre premier produit pour commencer à gérer votre catalogue."
                                actionLabel="Créer un produit"
                                actionHref="/products/create"
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.data.map((product) => {
                                const primaryImage = getPrimaryImage(
                                    product.images,
                                );
                                const priceRange = getPriceRange(
                                    product.variants,
                                );
                                const totalStock = getTotalStock(
                                    product.variants,
                                );
                                const stockStatus = getProductStockStatus(product.variants);
                                const stockInfo = getStockStatusInfo(totalStock);

                                return (
                                    <Card
                                        key={product.id}
                                        className="overflow-hidden rounded-2xl border-border/80 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 group relative"
                                    >
                                        {/* Image Section with Hover Overlay */}
                                        <div className="relative aspect-square bg-beige overflow-hidden">
                                            <Link href={`/products/${product.id}`}>
                                                {primaryImage ? (
                                                    <>
                                                        <img
                                                            src={`/storage/${primaryImage.path}`}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const placeholder = target.parentElement?.querySelector('.product-placeholder');
                                                                if (placeholder) {
                                                                    (placeholder as HTMLElement).style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                        <div className="product-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige to-beige-light" style={{ display: 'none' }}>
                                                            <Package className="h-20 w-20 text-gray-300" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-beige to-beige-light">
                                                        <Package className="h-20 w-20 text-gray-300" />
                                                    </div>
                                                )}
                                            </Link>
                                            
                                            {/* Hover Overlay with Quick Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                <Link href={`/products/${product.id}`}>
                                                    <Button
                                                        size="sm"
                                                        className="bg-white text-burgundy hover:bg-burgundy hover:text-white font-sans uppercase tracking-wide"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={`/products/${product.id}/edit`}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-white/90 text-burgundy hover:bg-burgundy hover:text-white border-burgundy font-sans uppercase tracking-wide"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </div>

                                            {/* Stock Status Badge */}
                                            <div className="absolute top-3 right-3">
                                                <Badge
                                                    className={`${stockInfo.bgColor} ${stockInfo.textColor} border-0 font-sans text-xs font-semibold uppercase tracking-wide shadow-sm`}
                                                >
                                                    {stockInfo.label}
                                                </Badge>
                                            </div>

                                            {/* Brand Badge */}
                                            {product.brand && (
                                                <div className="absolute top-3 left-3">
                                                    <Badge className="bg-burgundy/90 text-white border-0 font-sans text-xs uppercase tracking-wide shadow-sm backdrop-blur-sm">
                                                        {product.brand.name}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>

                                        <CardHeader>
                                            <div className="flex items-start justify-between gap-3">
                                                <Link href={`/products/${product.id}`} className="flex-1">
                                                    <CardTitle className="text-base font-semibold line-clamp-2 text-gray-900 group-hover:text-burgundy transition-colors cursor-pointer">
                                                        {product.title}
                                                    </CardTitle>
                                                </Link>
                                                <Badge variant="secondary" className="text-xs">
                                                    {product.variants.length}
                                                </Badge>
                                            </div>
                                            <div className="mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {product.category.name}
                                                    {product.brand ? ` · ${product.brand.name}` : ''}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {product.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                    {product.description}
                                                </p>
                                            )}
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Prix</p>
                                                    <p className="text-sm font-semibold text-foreground">{priceRange}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Stock</p>
                                                    <p className={`text-sm font-semibold ${stockInfo.textColor}`}>{totalStock}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

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
