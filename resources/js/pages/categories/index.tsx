/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FolderTree, Plus, Edit, Trash2, Tag, ChevronRight, Package, Image as ImageIcon } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState, useEffect } from 'react';
import { CategoryListSkeleton } from '@/components/skeleton-loaders';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Categories',
        href: '/categories',
    },
];

interface CategoryImage {
    id: number;
    path: string;
}

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: Category | null;
    children?: Category[];
    images?: CategoryImage[];
    products_count?: number;
}

interface CategoriesProps {
    categories: Category[];
}

export default function CategoriesIndex({ categories }: CategoriesProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: number | null }>({
        open: false,
        categoryId: null,
    });

    // Demo loading delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 350);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = (categoryId: number) => {
        setDeleteDialog({ open: true, categoryId });
    };

    const confirmDelete = () => {
        if (deleteDialog.categoryId) {
            router.delete(`/categories/${deleteDialog.categoryId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories - ElbaIntimo" />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, categoryId: null })}
                onConfirm={confirmDelete}
                title="Delete Category"
                description="Are you sure you want to delete this category? This will also delete all subcategories and products. This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                            Catégories
                        </h1>
                        <p className="text-sm text-gray-600">
                            Gérez vos catégories de produits
                        </p>
                    </div>
                    <Link href="/categories/create" className="inline-flex">
                        <Button className="bg-burgundy text-white hover:bg-burgundy-dark font-medium">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle catégorie
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <CategoryListSkeleton count={3} />
                ) : categories.length === 0 ? (
                    <Card className="border-border/80">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderTree className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-1">
                                Aucune catégorie
                            </p>
                            <p className="text-sm text-gray-600">
                                Créez votre première catégorie pour commencer.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <Card
                                key={category.id}
                                className="hover:shadow-md transition-shadow border-border/80 overflow-hidden group"
                            >
                                <div className="grid md:grid-cols-4 gap-0">
                                    {/* Category Image */}
                                    <div className="md:col-span-1 aspect-[4/3] md:aspect-auto bg-gradient-to-br from-burgundy/10 to-beige relative overflow-hidden">
                                        {category.images && category.images.length > 0 ? (
                                            <img
                                                src={`/storage/${category.images[0].path}`}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const placeholder = target.parentElement?.querySelector('.category-placeholder');
                                                    if (placeholder) {
                                                        (placeholder as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className={`category-placeholder absolute inset-0 flex items-center justify-center ${category.images && category.images.length > 0 ? 'hidden' : ''}`}>
                                            <FolderTree className="h-16 w-16 text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                                        </div>
                                    </div>

                                    {/* Category Info */}
                                    <div className="md:col-span-3 p-6">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle className="text-xl font-semibold text-gray-900">
                                                        {category.name}
                                                    </CardTitle>
                                                    {category.products_count !== undefined && (
                                                        <Badge className="bg-gray-100 text-gray-700 text-xs border-0">
                                                            {category.products_count}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {category.parent && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                                        <Tag className="h-3.5 w-3.5" />
                                                        <span>Parent:</span>
                                                        <span className="font-medium text-gray-700">
                                                            {category.parent.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Children Categories */}
                                        {category.children && category.children.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-sans font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                                    Subcategories ({category.children.length})
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {category.children.map((child) => (
                                                        <Link
                                                            key={child.id}
                                                            href={`/categories/${child.id}/edit`}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-beige hover:bg-burgundy/10 rounded-sm border border-border/80 hover:border-burgundy/50 transition-colors group/child"
                                                        >
                                                            <ChevronRight className="h-3 w-3 text-gray-400 group-hover/child:text-burgundy transition-colors" />
                                                            <span className="text-sm font-sans text-gray-700 group-hover/child:text-burgundy transition-colors">
                                                                {child.name}
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-border/80">
                                            <Link
                                                href={`/categories/${category.id}/edit`}
                                                className="flex-1"
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
                                                >
                                                    <Edit className="h-3 w-3 mr-2" />
                                                    Modifier
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(category.id)}
                                                className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                                            >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}





