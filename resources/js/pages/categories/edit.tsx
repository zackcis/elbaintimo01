/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { SingleImageUpload } from '@/components/image-upload';

interface CategoryImage {
    id: number;
    path: string;
}

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    images?: CategoryImage[];
}

interface ParentOption {
    id: number;
    label: string;
}

interface CategoryFormProps {
    category: Category;
    parentOptions: ParentOption[];
}

interface Image {
    path: string;
}

export default function EditCategory({ category, parentOptions }: CategoryFormProps) {
    const page = usePage();
    const errors = (page.props as any).errors || {};

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Categories',
            href: '/categories',
        },
        {
            title: 'Edit',
            href: '#',
        },
    ];

    const existingImage = category.images && category.images.length > 0 ? category.images[0] : null;
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const uploadData = new FormData();
        uploadData.append('_method', 'PUT');
        uploadData.append('name', formData.get('name') as string);
        if (formData.get('parent_id')) {
            uploadData.append('parent_id', formData.get('parent_id') as string);
        }
        
        if (imageFile) {
            uploadData.append('images[0][file]', imageFile);
        } else if (existingImage) {
            uploadData.append('images[0][id]', existingImage.id.toString());
            uploadData.append('images[0][path]', existingImage.path);
        }

        router.post(`/categories/${category.id}`, uploadData, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Category - HARIMI" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        Edit Category
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        Update category information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Category Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-sans font-semibold">
                                    Category Name *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={category.name}
                                    className="border-gray-300"
                                    placeholder="Enter category name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="parent_id" className="font-sans font-semibold">
                                    Parent Category (Optional)
                                </Label>
                                <select
                                    id="parent_id"
                                    name="parent_id"
                                    defaultValue={category.parent_id?.toString() || ''}
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-burgundy focus-visible:ring-burgundy/50 focus-visible:ring-[3px]"
                                >
                                    <option value="">None (Top-level category)</option>
                                    {parentOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.parent_id} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card className="border-gray-200 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Category Image
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="bg-white pt-4">
                            <SingleImageUpload
                                value={imageFile || existingImage?.path}
                                onChange={setImageFile}
                                preview={existingImage ? `/storage/${existingImage.path}` : null}
                                label="Category Image (Optional)"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-sans uppercase tracking-wide px-8 py-3 rounded-sm"
                        >
                            Update Category
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/categories')}
                            className="border-gray-300 font-sans uppercase tracking-wide"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

