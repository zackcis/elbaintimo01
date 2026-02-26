/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
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

interface Brand {
    id: number;
    name: string;
    logo: string | null;
}

interface EditBrandProps {
    brand: Brand;
}

export default function EditBrand({ brand }: EditBrandProps) {
    const page = usePage();
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: dashboard().url },
        { title: 'Brands', href: '/brands' },
        { title: 'Edit', href: '#' },
    ];

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const uploadData = new FormData();
        uploadData.append('_method', 'PUT');
        uploadData.append('name', formData.get('name') as string);
        if (logoFile) {
            uploadData.append('logo', logoFile);
        }

        router.post(`/brands/${brand.id}`, uploadData, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${brand.name} - ElbaIntimo`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        Edit Brand
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        Update brand information
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                Brand Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-sans font-semibold">
                                    Brand Name *
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    defaultValue={brand.name}
                                    className="border-gray-300"
                                    placeholder="Enter brand name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <SingleImageUpload
                                    value={logoFile || brand.logo}
                                    onChange={setLogoFile}
                                    preview={brand.logo ? `/storage/${brand.logo}` : null}
                                    label="Logo (Optional)"
                                />
                                <InputError message={errors.logo} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-sans uppercase tracking-wide px-8 py-3 rounded-sm"
                        >
                            Update Brand
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/brands')}
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
