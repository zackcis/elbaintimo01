/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { index as brandsIndex, update as brandUpdate } from '@/routes/brands';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { SingleImageUpload } from '@/components/image-upload';

interface BrandTranslationRow {
    locale: string;
    name: string;
}

interface Brand {
    id: number;
    name: string;
    logo: string | null;
    hero_path?: string | null;
    translations?: BrandTranslationRow[];
}

interface EditBrandProps {
    brand: Brand;
}

export default function EditBrand({ brand }: EditBrandProps) {
    const { t } = useUi();
    const page = usePage();
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [clearHero, setClearHero] = useState(false);

    const nameFor = (loc: string) => brand.translations?.find((t) => t.locale === loc)?.name ?? brand.name;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('brands.title'), href: brandsIndex().url },
        { title: t('breadcrumb.edit'), href: '#' },
    ];

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const uploadData = new FormData();
        uploadData.append('_method', 'PUT');
        uploadData.append('name[it]', (formData.get('name[it]') as string) || '');
        uploadData.append('name[en]', (formData.get('name[en]') as string) || '');
        if (logoFile) {
            uploadData.append('logo', logoFile);
        }
        if (heroFile) {
            uploadData.append('hero', heroFile);
        } else if (clearHero) {
            uploadData.append('clear_hero', '1');
        }

        router.post(brandUpdate.url({ brand: brand.id }), uploadData, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('common.edit')} ${brand.name} - HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                        {t('common.edit')} {t('brands.title')}
                    </h1>
                    <p className="text-base text-gray-700 font-sans">
                        {t('brands.edit_subtitle')}
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
                                        defaultValue={nameFor('it')}
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
                                        defaultValue={nameFor('en')}
                                        className="border-gray-300"
                                        placeholder="Brand name"
                                    />
                                    <InputError message={errors['name.en']} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <SingleImageUpload
                                    value={logoFile || brand.logo}
                                    onChange={setLogoFile}
                                    preview={brand.logo ? `/storage/${brand.logo}` : null}
                                    label={t('brands.logo_optional')}
                                />
                                <InputError message={errors.logo} />
                            </div>

                            <div className="grid gap-2">
                                <SingleImageUpload
                                    value={heroFile || (!clearHero ? brand.hero_path : null)}
                                    onChange={(file) => {
                                        setHeroFile(file);
                                        if (file) {
                                            setClearHero(false);
                                        }
                                    }}
                                    preview={
                                        !clearHero && brand.hero_path
                                            ? `/storage/${brand.hero_path}`
                                            : null
                                    }
                                    label={t('brands.hero_optional')}
                                />
                                {brand.hero_path && !clearHero ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-gray-300 w-fit"
                                        onClick={() => {
                                            setHeroFile(null);
                                            setClearHero(true);
                                        }}
                                    >
                                        {t('site_media.clear')}
                                    </Button>
                                ) : null}
                                <InputError message={errors.hero} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-sans uppercase tracking-wide px-8 py-3 rounded-sm"
                        >
                            {t('common.save')}
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
