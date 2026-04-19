/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { index as productsIndex } from '@/routes/products';
import { ArrowLeft, FolderTree, Package, Image as ImageIcon, ListFilter } from 'lucide-react';

interface CategoryImage {
    id: number;
    path: string;
}

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: { id: number; name: string } | null;
    children?: Category[];
    images?: CategoryImage[];
    products?: Array<{ id: number; title: string }>;
}

interface CategoryShowProps {
    category: Category;
}

export default function CategoryShow({ category }: CategoryShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Categories', href: '/categories' },
        { title: category.name, href: '#' },
    ];

    const children = category.children ?? [];
    const products = category.products ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${category.name} - HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <Link
                    href="/categories"
                    className="inline-flex items-center gap-2 text-burgundy hover:text-burgundy-dark font-sans uppercase tracking-wide text-sm transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to categories
                </Link>

                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                            {category.name}
                        </h1>
                        {category.parent && (
                            <p className="text-sm text-gray-600">
                                Parent:{' '}
                                <Link
                                    href={`/categories/${category.parent.id}`}
                                    className="text-burgundy hover:underline"
                                >
                                    {category.parent.name}
                                </Link>
                            </p>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FolderTree className="h-5 w-5 text-gray-600" />
                                    Subcategories ({children.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {children.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No subcategories
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {children.map((child) => (
                                            <li key={child.id}>
                                                <Link
                                                    href={`/categories/${child.id}`}
                                                    className="text-burgundy hover:underline text-sm"
                                                >
                                                    {child.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Package className="h-5 w-5 text-gray-600" />
                                    Products ({products.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {products.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No products in this category
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {products.map((product) => (
                                            <li key={product.id}>
                                                <Link
                                                    href={`/products/${product.id}`}
                                                    className="text-burgundy hover:underline text-sm"
                                                >
                                                    {product.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {category.images && category.images.length > 0 && (
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-gray-600" />
                                    Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4">
                                    {category.images.map((img) => (
                                        <img
                                            key={img.id}
                                            src={`/storage/${img.path}`}
                                            alt=""
                                            className="h-24 w-24 object-cover rounded border border-border/80"
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Link href={`${productsIndex().url}?category=${category.id}`}>
                            <Button className="bg-burgundy text-white hover:bg-burgundy-dark">
                                <ListFilter className="h-4 w-4 mr-2" />
                                Voir les produits (catégorie)
                            </Button>
                        </Link>
                        <Link href={`/categories/${category.id}/edit`}>
                            <Button variant="outline" className="border-gray-300">
                                Edit category
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
