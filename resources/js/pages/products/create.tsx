/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as products } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { MultipleImageUpload, SingleImageUpload } from '@/components/image-upload';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Products',
        href: products().url,
    },
    {
        title: 'Create',
        href: '#',
    },
];

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Brand {
    id: number;
    name: string;
}

interface ProductFormProps {
    categories: Category[];
    brands: Brand[];
}

interface Variant {
    size: string;
    color: string;
    price: string;
    stock: string;
}

interface Image {
    id?: number;
    file?: File | null;
    path?: string;
    preview?: string;
    is_primary: boolean;
    position: number;
}

type BrandMode = 'existing' | 'new';

export default function CreateProduct({ categories, brands }: ProductFormProps) {
    const page = usePage();
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};

    const [variants, setVariants] = useState<Variant[]>([
        { size: '', color: '', price: '', stock: '' },
    ]);
    const [images, setImages] = useState<Image[]>([]);
    const [brandMode, setBrandMode] = useState<BrandMode>('existing');
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandLogo, setNewBrandLogo] = useState<File | null>(null);

    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', price: '', stock: '' }]);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index: number, field: keyof Variant, value: string) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        setVariants(updated);
    };


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        // Create FormData for file upload
        const uploadData = new FormData();
        uploadData.append('title', formData.get('title') as string);
        uploadData.append('description', (formData.get('description') as string) || '');
        uploadData.append('category_id', formData.get('category_id') as string);

        if (brandMode === 'existing') {
            const brandId = formData.get('brand_id');
            if (brandId) {
                uploadData.append('brand_id', brandId as string);
            }
        } else if (brandMode === 'new' && newBrandName.trim()) {
            uploadData.append('new_brand_name', newBrandName.trim());
            if (newBrandLogo) {
                uploadData.append('new_brand_logo', newBrandLogo);
            }
        }

        // Add variants
        variants.forEach((v, index) => {
            uploadData.append(`variants[${index}][size]`, v.size || '');
            uploadData.append(`variants[${index}][color]`, v.color || '');
            uploadData.append(`variants[${index}][price]`, v.price);
            uploadData.append(`variants[${index}][stock]`, v.stock);
        });

        // Add images
        images.forEach((img, index) => {
            if (img.file) {
                uploadData.append(`images[${index}][file]`, img.file);
            }
            uploadData.append(`images[${index}][is_primary]`, img.is_primary ? '1' : '0');
            uploadData.append(`images[${index}][position]`, img.position.toString());
        });
        
        router.post('/products', uploadData, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Product - HARIMI" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        Create Product
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        Add a new product to your catalog
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Product Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title" className="font-sans font-semibold">
                                    Product Title *
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    required
                                    className="border-gray-300"
                                    placeholder="Enter product title"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category_id" className="font-sans font-semibold">
                                    Category *
                                </Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    required
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-burgundy focus-visible:ring-burgundy/50 focus-visible:ring-[3px]"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.category_id} />
                            </div>

                            {/* Brand: existing or add new */}
                            <div className="grid gap-3">
                                <Label className="font-sans font-semibold">
                                    Brand
                                </Label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="brand_mode"
                                            checked={brandMode === 'existing'}
                                            onChange={() => setBrandMode('existing')}
                                            className="rounded-full border-gray-300 text-burgundy focus:ring-burgundy"
                                        />
                                        <span className="text-sm font-sans">Use existing brand</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="brand_mode"
                                            checked={brandMode === 'new'}
                                            onChange={() => setBrandMode('new')}
                                            className="rounded-full border-gray-300 text-burgundy focus:ring-burgundy"
                                        />
                                        <span className="text-sm font-sans">Add new brand</span>
                                    </label>
                                </div>
                                {brandMode === 'existing' ? (
                                    <select
                                        id="brand_id"
                                        name="brand_id"
                                        className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-burgundy focus-visible:ring-burgundy/50 focus-visible:ring-[3px]"
                                    >
                                        <option value="">No brand</option>
                                        {brands.map((brand) => (
                                            <option key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="space-y-3 rounded-lg border border-border/80 bg-beige/50 p-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="new_brand_name" className="text-sm font-sans font-semibold">
                                                New brand name *
                                            </Label>
                                            <Input
                                                id="new_brand_name"
                                                value={newBrandName}
                                                onChange={(e) => setNewBrandName(e.target.value)}
                                                className="border-gray-300"
                                                placeholder="Enter brand name"
                                            />
                                            <InputError message={errors.new_brand_name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <SingleImageUpload
                                                value={newBrandLogo}
                                                onChange={setNewBrandLogo}
                                                label="Brand logo (optional)"
                                            />
                                            <InputError message={errors.new_brand_logo} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description" className="font-sans font-semibold">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    className="border-gray-300"
                                    placeholder="Enter product description"
                                />
                                <InputError message={errors.description} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Variants */}
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardHeader className="bg-white flex flex-row items-center justify-between">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Product Variants *
                            </CardTitle>
                            <Button
                                type="button"
                                onClick={addVariant}
                                variant="outline"
                                size="sm"
                                className="font-sans uppercase tracking-wide border-burgundy text-burgundy hover:bg-burgundy hover:text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Variant
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            {variants.map((variant, index) => (
                                <div
                                    key={index}
                                    className="p-4 border border-border/80 rounded-lg space-y-4 bg-beige-light"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-serif font-semibold text-burgundy">
                                            Variant {index + 1}
                                        </h4>
                                        {variants.length > 1 && (
                                            <Button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Size
                                            </Label>
                                            <Input
                                                value={variant.size}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'size',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., M, L, XL"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Color
                                            </Label>
                                            <Input
                                                value={variant.color}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'color',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g., Black, Red"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Price *
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={variant.price}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'price',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                                placeholder="0.00"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Stock *
                                            </Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={variant.stock}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'stock',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                                placeholder="0"
                                                className="border-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {errors.variants && (
                                <InputError message={errors.variants} />
                            )}
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Product Images
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="bg-white pt-4">
                            <MultipleImageUpload
                                images={images}
                                onChange={setImages}
                                maxImages={10}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-sans uppercase tracking-wide px-8 py-3 rounded-sm"
                        >
                            Create Product
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(products().url)}
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
