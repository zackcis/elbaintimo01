/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as products } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Package, Image as ImageIcon, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
import { ResourceViewSwitcher } from '@/components/resource-view-switcher';
import { useResourceViewMode } from '@/hooks/use-resource-view-mode';
import { cn } from '@/lib/utils';
import type { ResourceViewMode } from '@/lib/resource-view';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Brands', href: '/brands' },
];

interface Brand {
    id: number;
    name: string;
    logo: string | null;
    products_count: number;
}

interface BrandsProps {
    brands: Brand[];
}

function brandGridClass(mode: ResourceViewMode): string {
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

export default function BrandsIndex({ brands }: BrandsProps) {
    const page = usePage();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; brandId: number | null }>({
        open: false,
        brandId: null,
    });
    const { mode: viewMode, setMode: setViewMode } = useResourceViewMode('harimi-brands-view');

    const flash = (page.props as { flash?: { success?: string } }).flash;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = (brandId: number) => {
        setDeleteDialog({ open: true, brandId });
    };

    const confirmDelete = () => {
        if (deleteDialog.brandId) {
            router.delete(`/brands/${deleteDialog.brandId}`, {
                onSuccess: () => toast.success('Brand deleted successfully.'),
            });
            setDeleteDialog({ open: false, brandId: null });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Brands - HARIMI" />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, brandId: null })}
                onConfirm={confirmDelete}
                title="Delete Brand"
                description="Are you sure you want to delete this brand? Products linked to it will keep the brand reference until you update them."
                confirmText="Delete"
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-8 bg-beige/30 p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-3">
                        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                            Brands
                        </h1>
                        <p className="font-sans text-sm text-muted-foreground md:text-base">
                            Manage brands ({brands.length} brands)
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <ResourceViewSwitcher mode={viewMode} onChange={setViewMode} />
                        <Link href="/brands/create" className="inline-flex">
                            <Button className="bg-burgundy text-white hover:bg-burgundy-dark font-medium">
                                <Plus className="h-4 w-4 mr-2" />
                                New Brand
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <ProductListSkeleton count={8} />
                ) : brands.length === 0 ? (
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardContent className="flex flex-col items-center justify-center py-16 bg-white">
                            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-xl font-serif font-semibold mb-2 text-burgundy">
                                No brands yet
                            </p>
                            <p className="text-sm text-gray-600 font-sans mb-4">
                                Create your first brand to assign to products.
                            </p>
                            <Link href="/brands/create">
                                <Button className="bg-burgundy text-white hover:bg-burgundy-dark">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Brand
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {viewMode === 'details' ? (
                            <div className="overflow-x-auto rounded-xl border border-border/80 bg-white shadow-sm">
                                <table className="w-full min-w-[640px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            <th className="px-3 py-3 w-16"> </th>
                                            <th className="px-3 py-3">Name</th>
                                            <th className="px-3 py-3 text-right">Products</th>
                                            <th className="px-3 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brands.map((brand) => (
                                            <tr
                                                key={brand.id}
                                                className={cn(
                                                    'border-b border-border/60 transition-colors hover:bg-muted/30',
                                                    selectedBrand === brand.id && 'bg-burgundy/5',
                                                )}
                                                onClick={() =>
                                                    setSelectedBrand(selectedBrand === brand.id ? null : brand.id)
                                                }
                                            >
                                                <td className="px-3 py-2 align-middle">
                                                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-beige">
                                                        {brand.logo ? (
                                                            <img
                                                                src={`/storage/${brand.logo}`}
                                                                alt=""
                                                                className="h-full w-full object-contain p-1"
                                                            />
                                                        ) : (
                                                            <Building2 className="h-6 w-6 text-gray-300" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 align-middle font-medium text-foreground">
                                                    {brand.name}
                                                </td>
                                                <td className="px-3 py-2 align-middle text-right tabular-nums text-muted-foreground">
                                                    {brand.products_count}
                                                </td>
                                                <td
                                                    className="px-3 py-2 align-middle text-right"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link href={`${products().url}?brand=${brand.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/brands/${brand.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(brand.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="flex flex-col gap-2">
                                {brands.map((brand) => (
                                    <div
                                        key={brand.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            setSelectedBrand(selectedBrand === brand.id ? null : brand.id)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedBrand(selectedBrand === brand.id ? null : brand.id);
                                            }
                                        }}
                                        className={cn(
                                            'flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
                                            selectedBrand === brand.id && 'ring-2 ring-burgundy border-burgundy',
                                        )}
                                    >
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-beige">
                                            {brand.logo ? (
                                                <img
                                                    src={`/storage/${brand.logo}`}
                                                    alt=""
                                                    className="h-full w-full object-contain p-1"
                                                />
                                            ) : (
                                                <Building2 className="h-7 w-7 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-foreground">{brand.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {brand.products_count}{' '}
                                                {brand.products_count === 1 ? 'product' : 'products'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Link href={`${products().url}?brand=${brand.id}`}>
                                                <Button variant="outline" size="sm" className="h-8">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                            <Link href={`/brands/${brand.id}/edit`}>
                                                <Button variant="outline" size="sm" className="h-8">
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(brand.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={brandGridClass(viewMode)}>
                                {brands.map((brand) => {
                                    const density =
                                        viewMode === 'large-icons'
                                            ? 'lg'
                                            : viewMode === 'small-icons'
                                              ? 'sm'
                                              : 'md';
                                    const logoPad = density === 'sm' ? 'p-2' : density === 'lg' ? 'p-6' : 'p-4';
                                    const placeholderIcon =
                                        density === 'sm' ? 'h-10 w-10' : density === 'lg' ? 'h-24 w-24' : 'h-16 w-16';
                                    return (
                                        <Card
                                            key={brand.id}
                                            className={cn(
                                                'group cursor-pointer overflow-hidden rounded-lg border-border/80 transition-all duration-300 hover:shadow-xl',
                                                selectedBrand === brand.id && 'ring-2 ring-burgundy border-burgundy',
                                                density === 'sm' && 'rounded-xl',
                                            )}
                                            onClick={() =>
                                                setSelectedBrand(selectedBrand === brand.id ? null : brand.id)
                                            }
                                        >
                                            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-burgundy/5 to-beige">
                                                {brand.logo ? (
                                                    <>
                                                        <img
                                                            src={`/storage/${brand.logo}`}
                                                            alt={brand.name}
                                                            className={cn(
                                                                'h-full w-full object-contain',
                                                                logoPad,
                                                            )}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                                const placeholder = target.parentElement?.querySelector(
                                                                    '.brand-placeholder',
                                                                );
                                                                if (placeholder) {
                                                                    (placeholder as HTMLElement).style.display =
                                                                        'flex';
                                                                }
                                                            }}
                                                        />
                                                        <div className="brand-placeholder absolute inset-0 hidden">
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <ImageIcon className={cn(placeholderIcon, 'text-gray-300')} />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Building2
                                                            className={cn(
                                                                placeholderIcon,
                                                                'text-gray-300 transition-transform duration-300 group-hover:scale-110',
                                                            )}
                                                        />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />
                                            </div>

                                            <CardHeader className={cn('bg-white', density === 'sm' && 'p-3 pb-2')}>
                                                <CardTitle
                                                    className={cn(
                                                        'text-center font-serif font-bold text-burgundy transition-colors duration-150 group-hover:text-burgundy-dark',
                                                        density === 'lg' && 'text-xl',
                                                        density === 'md' && 'text-lg',
                                                        density === 'sm' && 'text-sm leading-tight',
                                                    )}
                                                >
                                                    {brand.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className={cn('bg-white', density === 'sm' && 'p-3 pt-0')}>
                                                <div
                                                    className={cn(
                                                        'flex items-center justify-center gap-2 border-t border-gray-100 pt-2',
                                                        density === 'lg' && 'pt-3',
                                                    )}
                                                >
                                                    <Package className="h-4 w-4 shrink-0 text-burgundy" />
                                                    <span
                                                        className={cn(
                                                            'font-serif font-semibold text-burgundy',
                                                            density === 'sm' ? 'text-sm' : 'text-base',
                                                        )}
                                                    >
                                                        {brand.products_count}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'font-sans text-gray-600',
                                                            density === 'sm' ? 'text-xs' : 'text-sm',
                                                        )}
                                                    >
                                                        {brand.products_count === 1 ? 'product' : 'products'}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        'mt-4 flex flex-wrap justify-center gap-2 border-t border-gray-100 pt-4',
                                                        density === 'sm' && 'mt-2 pt-2',
                                                    )}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link href={`/brands/${brand.id}/edit`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-gray-300"
                                                            type="button"
                                                        >
                                                            <Edit className="h-3.5 w-3.5 mr-1" />
                                                            {density === 'sm' ? (
                                                                <span className="sr-only">Edit</span>
                                                            ) : (
                                                                'Edit'
                                                            )}
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(brand.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                        {density === 'sm' ? (
                                                            <span className="sr-only">Delete</span>
                                                        ) : (
                                                            'Delete'
                                                        )}
                                                    </Button>
                                                    {selectedBrand === brand.id && (
                                                        <Link href={`${products().url}?brand=${brand.id}`} className="mt-2 w-full">
                                                            <Badge className="w-full justify-center border-0 bg-burgundy py-2 font-sans text-xs uppercase tracking-wide text-white">
                                                                View Products
                                                            </Badge>
                                                        </Link>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {selectedBrand && (
                            <Card className="border-burgundy/20 bg-burgundy/5 border-2 rounded-lg">
                                <CardContent className="p-6">
                                    <p className="text-sm text-gray-700 font-sans text-center">
                                        Click on a brand card above to filter products by that brand.
                                        <br />
                                        <Link
                                            href={products().url}
                                            className="text-burgundy hover:text-burgundy-dark font-semibold underline mt-2 inline-block"
                                        >
                                            View all products
                                        </Link>
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

