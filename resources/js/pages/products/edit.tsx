/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as products, update as productUpdate } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    type BrandMode,
    validateProductBasics,
    validateVariantRows,
} from '@/lib/product-variant-client-validation';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { MultipleImageUpload, SingleImageUpload } from '@/components/image-upload';

interface Category {
    id: number;
    name: string;
    parent_id: number | null;
}

interface Brand {
    id: number;
    name: string;
}

interface ProductVariant {
    id: number;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    price: string;
    compare_at_price: string | null;
    stock: number;
}

interface ProductImage {
    id: number;
    path: string;
    is_primary: boolean;
    position: number;
}

interface ProductTranslationRow {
    locale: string;
    title: string;
    description: string | null;
    care_notes: string | null;
    fit_notes: string | null;
}

interface Product {
    id: number;
    title: string;
    description: string | null;
    category_id: number;
    brand_id: number | null;
    tissu: string | null;
    is_published: boolean;
    published_at: string | null;
    translations: ProductTranslationRow[];
    variants: ProductVariant[];
    images: ProductImage[];
}

interface RelatedCandidate {
    id: number;
    title: string;
    is_published: boolean;
}

interface ProductFormProps {
    product: Product;
    categories: Category[];
    brands: Brand[];
    relatedCandidates?: RelatedCandidate[];
    relatedProductIds?: number[];
}

interface Variant {
    size: string;
    color: string;
    color_hex: string;
    price: string;
    compare_at_price: string;
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

export default function EditProduct({
    product,
    categories,
    brands,
    relatedCandidates = [],
    relatedProductIds = [],
}: ProductFormProps) {
    const page = usePage();
    const serverErrors = (page.props as { errors?: Record<string, string> }).errors || {};
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const mergedErrors = useMemo(
        () => ({ ...clientErrors, ...serverErrors }),
        [clientErrors, serverErrors],
    );
    const fieldId = (key: string) => `field-${key.replace(/\./g, '-')}`;

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
            title: 'Edit',
            href: '#',
        },
    ];

    const [variants, setVariants] = useState<Variant[]>(
        product.variants.length > 0
            ? product.variants.map((v) => ({
                  size: v.size || '',
                  color: v.color || '',
                  color_hex: v.color_hex || '',
                  price: v.price,
                  compare_at_price:
                      v.compare_at_price != null && v.compare_at_price !== ''
                          ? String(v.compare_at_price)
                          : '',
                  stock: v.stock.toString(),
              }))
            : [{ size: '', color: '', color_hex: '', price: '', compare_at_price: '', stock: '' }],
    );
    const [images, setImages] = useState<Image[]>(
        product.images.length > 0
            ? product.images.map((img) => ({
                  id: img.id,
                  path: img.path,
                  is_primary: img.is_primary,
                  position: img.position,
              }))
            : [],
    );

    const [brandMode, setBrandMode] = useState<BrandMode>('existing');
    const [newBrandLogo, setNewBrandLogo] = useState<File | null>(null);
    const [isPublished, setIsPublished] = useState<boolean>(!!product.is_published);
    const [relatedIds, setRelatedIds] = useState<number[]>(relatedProductIds);
    const [relatedPick, setRelatedPick] = useState('');

    const relatedById = useMemo(() => {
        const map = new Map<number, RelatedCandidate>();
        for (const c of relatedCandidates) {
            map.set(c.id, c);
        }
        return map;
    }, [relatedCandidates]);

    const tr = (loc: string) => product.translations?.find((t) => t.locale === loc);

    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', color_hex: '', price: '', compare_at_price: '', stock: '' }]);
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
        setClientErrors({});
        const clientValidation = {
            ...validateProductBasics(formData, brandMode),
            ...validateVariantRows(variants),
        };
        if (Object.keys(clientValidation).length > 0) {
            setClientErrors(clientValidation);
            const firstKey = Object.keys(clientValidation)[0];
            document.getElementById(fieldId(firstKey))?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            return;
        }

        // Create FormData for file upload
        const uploadData = new FormData();
        uploadData.append('_method', 'PUT');
        uploadData.append('title[it]', (formData.get('title[it]') as string) || '');
        uploadData.append('title[en]', (formData.get('title[en]') as string) || '');
        uploadData.append('description[it]', (formData.get('description[it]') as string) || '');
        uploadData.append('description[en]', (formData.get('description[en]') as string) || '');
        uploadData.append('care_notes[it]', (formData.get('care_notes[it]') as string) || '');
        uploadData.append('care_notes[en]', (formData.get('care_notes[en]') as string) || '');
        uploadData.append('fit_notes[it]', (formData.get('fit_notes[it]') as string) || '');
        uploadData.append('fit_notes[en]', (formData.get('fit_notes[en]') as string) || '');
        uploadData.append('category_id', formData.get('category_id') as string);
        uploadData.append('tissu', ((formData.get('tissu') as string) ?? '').trim());
        uploadData.append('is_published', isPublished ? '1' : '0');
        relatedIds.forEach((id, index) => {
            uploadData.append(`related_product_ids[${index}]`, String(id));
        });

        if (brandMode === 'existing') {
            const brandId = formData.get('brand_id');
            if (brandId) {
                uploadData.append('brand_id', brandId as string);
            }
        } else if (brandMode === 'new') {
            uploadData.append('new_brand_name[it]', (formData.get('new_brand_name[it]') as string) || '');
            uploadData.append('new_brand_name[en]', (formData.get('new_brand_name[en]') as string) || '');
            if (newBrandLogo) {
                uploadData.append('new_brand_logo', newBrandLogo);
            }
        }

        // Add variants
        variants.forEach((v, index) => {
            uploadData.append(`variants[${index}][size]`, v.size || '');
            uploadData.append(`variants[${index}][color]`, v.color || '');
            uploadData.append(`variants[${index}][color_hex]`, v.color_hex || '');
            uploadData.append(`variants[${index}][price]`, v.price);
            if (v.compare_at_price.trim() !== '') {
                uploadData.append(`variants[${index}][compare_at_price]`, v.compare_at_price);
            }
            uploadData.append(`variants[${index}][stock]`, v.stock);
        });

        // Add images
        images.forEach((img, index) => {
            if (img.id) {
                uploadData.append(`images[${index}][id]`, img.id.toString());
            }
            if (img.file) {
                uploadData.append(`images[${index}][file]`, img.file);
            } else if (img.path) {
                uploadData.append(`images[${index}][path]`, img.path);
            }
            uploadData.append(`images[${index}][is_primary]`, img.is_primary ? '1' : '0');
            uploadData.append(`images[${index}][position]`, img.position.toString());
        });
        
        router.post(productUpdate.url({ product: product.id }), uploadData, {
            forceFormData: true,
            onSuccess: () => setClientErrors({}),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Product - HARIMI" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        Edit Product
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        Update product information
                    </p>
                </div>

                {Object.keys(clientErrors).length > 0 && (
                    <div
                        role="alert"
                        className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        <p className="font-semibold font-sans">Please fix the highlighted fields</p>
                        <p className="mt-1 text-destructive/90">
                            The form was not sent because some values are missing or invalid. Review the messages
                            below each field.
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Product Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/80 bg-beige/40 px-4 py-3">
                                <div>
                                    <p className="font-sans text-sm font-semibold text-foreground">
                                        Storefront visibility
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Published products appear on the public API. Unpublished
                                        products are removed from merchandising shelves.
                                    </p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={(e) => setIsPublished(e.target.checked)}
                                        className="size-4 rounded border-gray-300 text-burgundy focus:ring-burgundy"
                                    />
                                    <span className="text-sm font-sans font-medium">
                                        {isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="title-it" className="font-sans font-semibold">
                                        Title (IT) *
                                    </Label>
                                    <Input
                                        id="title-it"
                                        name="title[it]"
                                        required
                                        defaultValue={tr('it')?.title ?? ''}
                                        className="border-gray-300"
                                        placeholder="Titolo prodotto"
                                    />
                                    <InputError message={mergedErrors['title.it']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="title-en" className="font-sans font-semibold">
                                        Title (EN) *
                                    </Label>
                                    <Input
                                        id="title-en"
                                        name="title[en]"
                                        required
                                        defaultValue={tr('en')?.title ?? ''}
                                        className="border-gray-300"
                                        placeholder="Product title"
                                    />
                                    <InputError message={mergedErrors['title.en']} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category_id" className="font-sans font-semibold">
                                    Category *
                                </Label>
                                <select
                                    id="category_id"
                                    name="category_id"
                                    required
                                    defaultValue={product.category_id}
                                    className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-burgundy focus-visible:ring-burgundy/50 focus-visible:ring-[3px]"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={mergedErrors.category_id} />
                            </div>

                            {/* Brand: existing or add new (same as create — keeps brand_id on save) */}
                            <div className="grid gap-3">
                                <Label className="font-sans font-semibold">Brand</Label>
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
                                        defaultValue={product.brand_id?.toString() ?? ''}
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
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="new_brand_name_it"
                                                    className="text-sm font-sans font-semibold"
                                                >
                                                    Brand name (IT) *
                                                </Label>
                                                <Input
                                                    id="new_brand_name_it"
                                                    name="new_brand_name[it]"
                                                    required
                                                    className="border-gray-300"
                                                    placeholder="Nome marca"
                                                />
                                                <InputError message={mergedErrors['new_brand_name.it']} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="new_brand_name_en"
                                                    className="text-sm font-sans font-semibold"
                                                >
                                                    Brand name (EN) *
                                                </Label>
                                                <Input
                                                    id="new_brand_name_en"
                                                    name="new_brand_name[en]"
                                                    required
                                                    className="border-gray-300"
                                                    placeholder="Brand name"
                                                />
                                                <InputError message={mergedErrors['new_brand_name.en']} />
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <SingleImageUpload
                                                value={newBrandLogo}
                                                onChange={setNewBrandLogo}
                                                label="Brand logo (optional)"
                                            />
                                            <InputError message={mergedErrors.new_brand_logo} />
                                        </div>
                                    </div>
                                )}
                                <InputError message={mergedErrors.brand_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="tissu" className="font-sans font-semibold">
                                    Tissu / matière (optionnel)
                                </Label>
                                <Input
                                    id="tissu"
                                    name="tissu"
                                    className="border-gray-300"
                                    defaultValue={product.tissu ?? ''}
                                    placeholder="ex. Coton, Soie, Dentelle…"
                                    maxLength={255}
                                />
                                <InputError message={mergedErrors.tissu} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="description-it" className="font-sans font-semibold">
                                        Description (IT)
                                    </Label>
                                    <Textarea
                                        id="description-it"
                                        name="description[it]"
                                        rows={4}
                                        defaultValue={tr('it')?.description ?? ''}
                                        className="border-gray-300"
                                        placeholder="Descrizione"
                                    />
                                    <InputError message={mergedErrors['description.it']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description-en" className="font-sans font-semibold">
                                        Description (EN)
                                    </Label>
                                    <Textarea
                                        id="description-en"
                                        name="description[en]"
                                        rows={4}
                                        defaultValue={tr('en')?.description ?? ''}
                                        className="border-gray-300"
                                        placeholder="Description"
                                    />
                                    <InputError message={mergedErrors['description.en']} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="care-notes-it" className="font-sans font-semibold">
                                        Care notes (IT)
                                    </Label>
                                    <Textarea
                                        id="care-notes-it"
                                        name="care_notes[it]"
                                        rows={3}
                                        defaultValue={tr('it')?.care_notes ?? ''}
                                        className="border-gray-300"
                                        placeholder="Lavaggio, stiratura…"
                                    />
                                    <InputError message={mergedErrors['care_notes.it']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="care-notes-en" className="font-sans font-semibold">
                                        Care notes (EN)
                                    </Label>
                                    <Textarea
                                        id="care-notes-en"
                                        name="care_notes[en]"
                                        rows={3}
                                        defaultValue={tr('en')?.care_notes ?? ''}
                                        className="border-gray-300"
                                        placeholder="Wash, iron…"
                                    />
                                    <InputError message={mergedErrors['care_notes.en']} />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="fit-notes-it" className="font-sans font-semibold">
                                        Fit notes (IT)
                                    </Label>
                                    <Textarea
                                        id="fit-notes-it"
                                        name="fit_notes[it]"
                                        rows={3}
                                        defaultValue={tr('it')?.fit_notes ?? ''}
                                        className="border-gray-300"
                                        placeholder="Vestibilità, consiglio taglia…"
                                    />
                                    <InputError message={mergedErrors['fit_notes.it']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="fit-notes-en" className="font-sans font-semibold">
                                        Fit notes (EN)
                                    </Label>
                                    <Textarea
                                        id="fit-notes-en"
                                        name="fit_notes[en]"
                                        rows={3}
                                        defaultValue={tr('en')?.fit_notes ?? ''}
                                        className="border-gray-300"
                                        placeholder="Fit, size tip…"
                                    />
                                    <InputError message={mergedErrors['fit_notes.en']} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/80 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Complete the Look
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <p className="text-sm text-muted-foreground font-sans">
                                Curated related products shown on the storefront PDP.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <select
                                    className="h-10 min-w-[220px] flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm"
                                    value={relatedPick}
                                    onChange={(e) => setRelatedPick(e.target.value)}
                                >
                                    <option value="">Select product…</option>
                                    {relatedCandidates
                                        .filter((c) => !relatedIds.includes(c.id))
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.title}
                                                {!c.is_published ? ' (draft)' : ''}
                                            </option>
                                        ))}
                                </select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="font-sans"
                                    onClick={() => {
                                        const id = Number(relatedPick);
                                        if (!id || relatedIds.includes(id)) return;
                                        setRelatedIds((prev) => [...prev, id]);
                                        setRelatedPick('');
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                            <ul className="space-y-2">
                                {relatedIds.map((id, index) => {
                                    const item = relatedById.get(id);
                                    return (
                                        <li
                                            key={id}
                                            className="flex items-center justify-between gap-3 rounded-md border border-border/80 px-3 py-2"
                                        >
                                            <span className="text-sm font-sans">
                                                {item?.title ?? `#${id}`}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={index === 0}
                                                    onClick={() =>
                                                        setRelatedIds((prev) => {
                                                            const next = [...prev];
                                                            [next[index - 1], next[index]] = [
                                                                next[index],
                                                                next[index - 1],
                                                            ];
                                                            return next;
                                                        })
                                                    }
                                                >
                                                    ↑
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    disabled={index === relatedIds.length - 1}
                                                    onClick={() =>
                                                        setRelatedIds((prev) => {
                                                            const next = [...prev];
                                                            [next[index], next[index + 1]] = [
                                                                next[index + 1],
                                                                next[index],
                                                            ];
                                                            return next;
                                                        })
                                                    }
                                                >
                                                    ↓
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setRelatedIds((prev) =>
                                                            prev.filter((x) => x !== id),
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <InputError message={mergedErrors.related_product_ids} />
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
                        <CardContent className="space-y-4 bg-white pt-4" id={fieldId('variants')}>
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
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
                                        <div className="grid gap-2" id={fieldId(`variants.${index}.color`)}>
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Color *
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
                                                className={
                                                    mergedErrors[`variants.${index}.color`]
                                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                                        : 'border-gray-300'
                                                }
                                                aria-invalid={Boolean(mergedErrors[`variants.${index}.color`])}
                                            />
                                            <InputError message={mergedErrors[`variants.${index}.color`]} />
                                        </div>
                                        <div className="grid gap-2" id={fieldId(`variants.${index}.color_hex`)}>
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Color hex *
                                            </Label>
                                            <Input
                                                value={variant.color_hex}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'color_hex',
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                                placeholder="#1A2B3C"
                                                className={
                                                    mergedErrors[`variants.${index}.color_hex`]
                                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                                        : 'border-gray-300'
                                                }
                                                aria-invalid={Boolean(mergedErrors[`variants.${index}.color_hex`])}
                                            />
                                            <p className="text-[11px] leading-snug text-muted-foreground font-sans">
                                                Required: # plus exactly 6 hex digits. Incomplete or invalid hex is
                                                rejected.
                                            </p>
                                            <InputError message={mergedErrors[`variants.${index}.color_hex`]} />
                                        </div>
                                        <div className="grid gap-2" id={fieldId(`variants.${index}.price`)}>
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Price (selling) *
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
                                                className={
                                                    mergedErrors[`variants.${index}.price`]
                                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                                        : 'border-gray-300'
                                                }
                                                aria-invalid={Boolean(mergedErrors[`variants.${index}.price`])}
                                            />
                                            <InputError message={mergedErrors[`variants.${index}.price`]} />
                                        </div>
                                        <div className="grid gap-2" id={fieldId(`variants.${index}.compare_at_price`)}>
                                            <Label className="text-xs font-sans uppercase tracking-wide text-gray-600">
                                                Was price (optional)
                                            </Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={variant.compare_at_price}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'compare_at_price',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="e.g. 49.90"
                                                className={
                                                    mergedErrors[`variants.${index}.compare_at_price`]
                                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                                        : 'border-gray-300'
                                                }
                                                aria-invalid={Boolean(
                                                    mergedErrors[`variants.${index}.compare_at_price`],
                                                )}
                                            />
                                            <p className="text-[11px] leading-snug text-muted-foreground font-sans">
                                                Leave empty for full price. To discount: selling price lower, was
                                                price higher.
                                            </p>
                                            <InputError
                                                message={mergedErrors[`variants.${index}.compare_at_price`]}
                                            />
                                        </div>
                                        <div className="grid gap-2" id={fieldId(`variants.${index}.stock`)}>
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
                                                className={
                                                    mergedErrors[`variants.${index}.stock`]
                                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                                        : 'border-gray-300'
                                                }
                                                aria-invalid={Boolean(mergedErrors[`variants.${index}.stock`])}
                                            />
                                            <InputError message={mergedErrors[`variants.${index}.stock`]} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {mergedErrors.variants && (
                                <InputError message={mergedErrors.variants} />
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
                                onChange={(next) => setImages(next as Image[])}
                                maxImages={10}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-sans uppercase tracking-wide px-8 py-3 rounded-sm"
                        >
                            Update Product
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
