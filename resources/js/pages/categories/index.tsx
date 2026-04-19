/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as productsIndex } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FolderTree, Plus, Edit, Trash2, Tag, Package } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState, useEffect, useMemo } from 'react';
import { CategoryListSkeleton } from '@/components/skeleton-loaders';
import { ResourceViewSwitcher } from '@/components/resource-view-switcher';
import { useResourceViewMode } from '@/hooks/use-resource-view-mode';
import { flattenCategoryTree } from '@/lib/flatten-categories';
import { cn } from '@/lib/utils';
import type { ResourceViewMode } from '@/lib/resource-view';

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

interface CategoryParent {
    id: number;
    name: string;
}

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: CategoryParent | null;
    children?: Category[];
    images?: CategoryImage[];
    products_count?: number;
}

interface CategoriesProps {
    categories: Category[];
}

function categoryGridClass(mode: ResourceViewMode): string {
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

function CategoryImagePanel({
    category,
    className,
    iconClass,
}: {
    category: Category;
    className?: string;
    iconClass?: string;
}) {
    const hasImg = category.images && category.images.length > 0;
    return (
        <div
            className={cn(
                'relative overflow-hidden bg-gradient-to-br from-burgundy/10 to-beige',
                className,
            )}
        >
            {hasImg ? (
                <>
                    <img
                        src={`/storage/${category.images![0].path}`}
                        alt={category.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.parentElement?.querySelector('.category-placeholder');
                            if (placeholder) {
                                (placeholder as HTMLElement).classList.remove('hidden');
                                (placeholder as HTMLElement).classList.add('flex');
                            }
                        }}
                    />
                    <div className="category-placeholder absolute inset-0 hidden items-center justify-center">
                        <FolderTree className={cn('text-gray-300', iconClass)} />
                    </div>
                </>
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <FolderTree className={cn('text-gray-300', iconClass)} />
                </div>
            )}
        </div>
    );
}

function CategoryActions({
    categoryId,
    onDelete,
    density,
}: {
    categoryId: number;
    onDelete: (id: number) => void;
    density?: 'lg' | 'md' | 'sm';
}) {
    const sm = density === 'sm';
    return (
        <div className={cn('flex flex-wrap items-center gap-2', sm ? 'pt-2' : 'pt-4')}>
            <Link href={`${productsIndex().url}?category=${categoryId}`} className="min-w-[88px] flex-1">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-burgundy/40 text-xs text-burgundy hover:bg-burgundy/10"
                >
                    <Package className="mr-1 h-3 w-3" />
                    {sm ? <span className="sr-only">Produits</span> : 'Produits'}
                </Button>
            </Link>
            <Link href={`/categories/${categoryId}/edit`} className="min-w-[88px] flex-1">
                <Button variant="outline" size="sm" className="w-full border-gray-300 text-xs text-gray-700 hover:bg-gray-50">
                    <Edit className="mr-1 h-3 w-3" />
                    {sm ? <span className="sr-only">Modifier</span> : 'Modifier'}
                </Button>
            </Link>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(categoryId)}
                className="shrink-0 border-red-300 text-xs text-red-600 hover:bg-red-50"
            >
                <Trash2 className="mr-1 h-3 w-3" />
                {sm ? <span className="sr-only">Supprimer</span> : 'Supprimer'}
            </Button>
        </div>
    );
}

export default function CategoriesIndex({ categories }: CategoriesProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId: number | null }>({
        open: false,
        categoryId: null,
    });
    const { mode: viewMode, setMode: setViewMode } = useResourceViewMode('harimi-categories-view');

    const flatCategories = useMemo(() => flattenCategoryTree(categories), [categories]);

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
            <Head title="Categories - HARIMI" />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, categoryId: null })}
                onConfirm={confirmDelete}
                title="Delete Category"
                description="Are you sure you want to delete this category? This will also delete all subcategories and products. This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 bg-beige/30 p-6 md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="mb-1 text-3xl font-semibold text-gray-900">Catégories</h1>
                        <p className="text-sm text-gray-600">
                            Gérez vos catégories (vue grille, liste ou détail — hiérarchie conservée dans les
                            données).
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <ResourceViewSwitcher mode={viewMode} onChange={setViewMode} />
                        <Link href="/categories/create" className="inline-flex">
                            <Button className="bg-burgundy font-medium text-white hover:bg-burgundy-dark">
                                <Plus className="mr-2 h-4 w-4" />
                                Nouvelle catégorie
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <CategoryListSkeleton count={3} />
                ) : categories.length === 0 ? (
                    <Card className="border-border/80">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderTree className="mb-4 h-12 w-12 text-gray-300" />
                            <p className="mb-1 text-lg font-medium text-gray-900">Aucune catégorie</p>
                            <p className="text-sm text-gray-600">Créez votre première catégorie pour commencer.</p>
                        </CardContent>
                    </Card>
                ) : viewMode === 'details' ? (
                    <div className="overflow-x-auto rounded-xl border border-border/80 bg-white shadow-sm">
                        <table className="w-full min-w-[800px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <th className="px-3 py-3 w-20"> </th>
                                    <th className="px-3 py-3">Nom</th>
                                    <th className="px-3 py-3">Parent</th>
                                    <th className="px-3 py-3 text-right">Sous-cat.</th>
                                    <th className="px-3 py-3 text-right">Produits</th>
                                    <th className="px-3 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flatCategories.map((category) => {
                                    const subCount = category.children?.length ?? 0;
                                    return (
                                        <tr
                                            key={category.id}
                                            className="border-b border-border/60 transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-3 py-2 align-middle">
                                                <div className="relative h-14 w-20 overflow-hidden rounded-lg">
                                                    <CategoryImagePanel
                                                        category={category}
                                                        className="h-full w-full"
                                                        iconClass="h-6 w-6"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 align-middle font-medium text-foreground">
                                                {category.name}
                                            </td>
                                            <td className="px-3 py-2 align-middle text-muted-foreground">
                                                {category.parent?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 align-middle text-right tabular-nums">
                                                {subCount}
                                            </td>
                                            <td className="px-3 py-2 align-middle text-right tabular-nums">
                                                {category.products_count ?? '—'}
                                            </td>
                                            <td className="px-3 py-2 align-middle text-right">
                                                <Link href={`${productsIndex().url}?category=${category.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Package className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/categories/${category.id}/edit`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(category.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="flex flex-col gap-2">
                        {flatCategories.map((category) => {
                            const subCount = category.children?.length ?? 0;
                            return (
                                <div
                                    key={category.id}
                                    className="flex flex-wrap items-center gap-4 rounded-xl border border-border/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                                        <CategoryImagePanel
                                            category={category}
                                            className="h-full w-full"
                                            iconClass="h-7 w-7"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-foreground">{category.name}</p>
                                        {category.parent && (
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Tag className="h-3 w-3" />
                                                {category.parent.name}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="text-[10px]">
                                                {subCount} sous-cat.
                                            </Badge>
                                            {category.products_count !== undefined && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {category.products_count} produits
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-1">
                                        <Link href={`${productsIndex().url}?category=${category.id}`}>
                                            <Button variant="outline" size="sm" className="h-8">
                                                <Package className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Link href={`/categories/${category.id}/edit`}>
                                            <Button variant="outline" size="sm" className="h-8">
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={categoryGridClass(viewMode)}>
                        {flatCategories.map((category) => {
                            const density =
                                viewMode === 'large-icons' ? 'lg' : viewMode === 'small-icons' ? 'sm' : 'md';
                            const subCount = category.children?.length ?? 0;
                            const iconSz = density === 'lg' ? 'h-20 w-20' : density === 'sm' ? 'h-10 w-10' : 'h-16 w-16';
                            return (
                                <Card
                                    key={category.id}
                                    className={cn(
                                        'overflow-hidden border-border/80 transition-shadow hover:shadow-md',
                                        density === 'sm' ? 'rounded-xl' : 'rounded-2xl',
                                    )}
                                >
                                    <CategoryImagePanel
                                        category={category}
                                        className="aspect-[4/3]"
                                        iconClass={iconSz}
                                    />
                                    <CardHeader className={cn(density === 'sm' && 'space-y-1 p-3 pb-2')}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <CardTitle
                                                className={cn(
                                                    'text-gray-900',
                                                    density === 'lg' && 'text-xl',
                                                    density === 'md' && 'text-lg',
                                                    density === 'sm' && 'text-sm leading-snug',
                                                )}
                                            >
                                                {category.name}
                                            </CardTitle>
                                            {category.products_count !== undefined && (
                                                <Badge className="border-0 bg-gray-100 text-xs text-gray-700">
                                                    {category.products_count}
                                                </Badge>
                                            )}
                                        </div>
                                        {category.parent && (
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Tag className="h-3 w-3 shrink-0" />
                                                <span className="line-clamp-1">{category.parent.name}</span>
                                            </p>
                                        )}
                                        {subCount > 0 && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {subCount} sous-catégorie{subCount > 1 ? 's' : ''}
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className={cn(density === 'sm' && 'p-3 pt-0')}>
                                        <div className="border-t border-border/80">
                                            <CategoryActions
                                                categoryId={category.id}
                                                onDelete={handleDelete}
                                                density={density}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
