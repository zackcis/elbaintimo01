/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as products } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Package, Image as ImageIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
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

export default function BrandsIndex({ brands }: BrandsProps) {
    const page = usePage();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; brandId: number | null }>({
        open: false,
        brandId: null,
    });

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
            <Head title="Brands - ElbaIntimo" />
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
            <div className="flex h-full flex-1 flex-col gap-8 p-6 bg-beige-light">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                            Brands
                        </h1>
                        <p className="text-base text-gray-700 font-sans">
                            Manage brands ({brands.length} brands)
                        </p>
                    </div>
                    <Link href="/brands/create" className="inline-flex">
                        <Button className="bg-burgundy text-white hover:bg-burgundy-dark font-medium">
                            <Plus className="h-4 w-4 mr-2" />
                            New Brand
                        </Button>
                    </Link>
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
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {brands.map((brand) => (
                                <Card
                                    key={brand.id}
                                    className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-border/80 rounded-lg group cursor-pointer ${
                                        selectedBrand === brand.id
                                            ? 'ring-2 ring-burgundy border-burgundy'
                                            : ''
                                    }`}
                                    onClick={() => {
                                        setSelectedBrand(selectedBrand === brand.id ? null : brand.id);
                                    }}
                                >
                                    {/* Logo Section */}
                                    <div className="aspect-square bg-gradient-to-br from-burgundy/5 to-beige relative overflow-hidden flex items-center justify-center">
                                        {brand.logo ? (
                                            <>
                                                <img
                                                    src={`/storage/${brand.logo}`}
                                                    alt={brand.name}
                                                    className="w-full h-full object-contain p-4"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        const placeholder = target.parentElement?.querySelector('.brand-placeholder');
                                                        if (placeholder) {
                                                            (placeholder as HTMLElement).style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                                <div className="brand-placeholder absolute inset-0 hidden">
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <ImageIcon className="h-16 w-16 text-gray-300" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Building2 className="h-20 w-20 text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                    </div>

                                    <CardHeader className="bg-white">
                                        <CardTitle className="text-lg font-serif font-bold text-center text-burgundy group-hover:text-burgundy-dark transition-colors duration-150">
                                            {brand.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="bg-white">
                                        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                                            <Package className="h-4 w-4 text-burgundy" />
                                            <span className="font-serif font-semibold text-burgundy text-base">
                                                {brand.products_count}
                                            </span>
                                            <span className="text-sm text-gray-600 font-sans">
                                                {brand.products_count === 1 ? 'product' : 'products'}
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                                            <Link href={`/brands/${brand.id}/edit`}>
                                                <Button variant="outline" size="sm" className="border-gray-300" type="button">
                                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                                    Edit
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
                                                Delete
                                            </Button>
                                            {selectedBrand === brand.id && (
                                                <Link href={`${products().url}?brand=${brand.id}`} className="w-full mt-2">
                                                    <Badge className="bg-burgundy text-white font-sans text-xs uppercase tracking-wide border-0 w-full justify-center py-2">
                                                        View Products
                                                    </Badge>
                                                </Link>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

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

