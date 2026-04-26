/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { create as brandsCreate, index as brandsIndex, store as brandsStore } from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { SingleImageUpload } from '@/components/image-upload';

export default function CreateBrand() {
    const { t } = useUi();
    const page = usePage();
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('brands.title'), href: brandsIndex().url },
        { title: t('breadcrumb.create'), href: '#' },
    ];

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const uploadData = new FormData();
        uploadData.append('name[it]', (formData.get('name[it]') as string) || '');
        uploadData.append('name[en]', (formData.get('name[en]') as string) || '');
        if (logoFile) {
            uploadData.append('logo', logoFile);
        }

        router.post(brandsStore.url(), uploadData, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('brands.create')} - HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        {t('brands.create')}
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        {t('brands.create_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 shadow-sm rounded-lg">
                        <CardHeader className="bg-white">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                {t('brands.section_info')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 bg-white pt-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name-it" className="font-sans font-semibold">
                                        Name (IT) *
                                    </Label>
                                    <Input
                                        id="name-it"
                                        name="name[it]"
                                        required
                                        className="border-gray-300"
                                        placeholder="Nome marca"
                                    />
                                    <InputError message={errors['name.it']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name-en" className="font-sans font-semibold">
                                        Name (EN) *
                                    </Label>
                                    <Input
                                        id="name-en"
                                        name="name[en]"
                                        required
                                        className="border-gray-300"
                                        placeholder="Brand name"
                                    />
                                    <InputError message={errors['name.en']} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <SingleImageUpload
                                    value={logoFile}
                                    onChange={setLogoFile}
                                    label={t('brands.logo_optional')}
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
                            {t('brands.create')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(brandsIndex().url)}
                            className="border-gray-300 font-sans uppercase tracking-wide"
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
