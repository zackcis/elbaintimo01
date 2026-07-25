/* REDESIGN: storefront media — guided Welcome + Home hero panels */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useUi } from '@/hooks/use-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ExternalLink, Film, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Audience = 'women' | 'men' | 'kids';
type MediaKey =
    | 'welcome'
    | 'home_still'
    | 'home_video_mp4'
    | 'home_video_webm'
    | 'new_arrivals_still'
    | 'instagram_1'
    | 'instagram_2'
    | 'instagram_3'
    | 'instagram_4'
    | 'instagram_5'
    | 'instagram_6';

const INSTAGRAM_KEYS: MediaKey[] = [
    'instagram_1',
    'instagram_2',
    'instagram_3',
    'instagram_4',
    'instagram_5',
    'instagram_6',
];

interface MediaSlot {
    path: string | null;
    url: string | null;
}

interface SiteMediaPageProps {
    media: Record<Audience, Record<MediaKey, MediaSlot>>;
    audiences: Audience[];
    keys: MediaKey[];
    storefrontUrl?: string;
}

const AUDIENCE_META: Record<
    Audience,
    {
        it: string;
        en: string;
        welcomePath: string;
        homePath: (locale: string) => string;
    }
> = {
    women: {
        it: 'Donna',
        en: 'Women',
        welcomePath: '/',
        homePath: (locale) => `/${locale}/women`,
    },
    men: {
        it: 'Uomo',
        en: 'Men',
        welcomePath: '/',
        homePath: (locale) => `/${locale}/men`,
    },
    kids: {
        it: 'Bambini',
        en: 'Kids',
        welcomePath: '/',
        homePath: (locale) => `/${locale}/kids`,
    },
};

function DropZone({
    previewUrl,
    isVideo,
    busy,
    accept,
    hint,
    emptyLabel,
    changeLabel,
    clearLabel,
    uploadingLabel,
    onFile,
    onClear,
    canClear,
}: {
    previewUrl: string | null;
    isVideo?: boolean;
    busy?: boolean;
    accept: string;
    hint: string;
    emptyLabel: string;
    changeLabel: string;
    clearLabel: string;
    uploadingLabel: string;
    onFile: (file: File) => void;
    onClear?: () => void;
    canClear?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) {
                        onFile(file);
                    }
                }}
            />

            {previewUrl ? (
                <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    {isVideo ? (
                        <video
                            src={previewUrl}
                            className="aspect-video max-h-64 w-full object-cover"
                            controls
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            alt=""
                            className="aspect-4/3 max-h-72 w-full object-cover"
                        />
                    )}
                    {busy ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    ) : (
                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-gradient-to-t from-ink/80 to-transparent p-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                size="sm"
                                className="bg-burgundy text-white hover:bg-burgundy-dark"
                                onClick={() => inputRef.current?.click()}
                            >
                                <Upload className="mr-1.5 h-3.5 w-3.5" />
                                {changeLabel}
                            </Button>
                            {canClear && onClear ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="border-white/40 bg-white/10 text-white hover:bg-white hover:text-ink"
                                    onClick={onClear}
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    {clearLabel}
                                </Button>
                            ) : null}
                        </div>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-6 py-14 text-center transition hover:border-burgundy hover:bg-burgundy/5 disabled:opacity-60"
                >
                    {busy ? (
                        <Loader2 className="mb-3 h-10 w-10 animate-spin text-burgundy" />
                    ) : isVideo ? (
                        <Film className="mb-3 h-10 w-10 text-gray-400" />
                    ) : (
                        <ImageIcon className="mb-3 h-10 w-10 text-gray-400" />
                    )}
                    <p className="text-sm font-sans font-semibold text-gray-800">
                        {busy ? uploadingLabel : emptyLabel}
                    </p>
                    <p className="mt-1 max-w-xs text-xs font-sans text-gray-500">{hint}</p>
                </button>
            )}
        </div>
    );
}

export default function SiteMediaIndex({
    media: initialMedia,
    audiences,
    storefrontUrl = 'http://localhost:3000',
}: SiteMediaPageProps) {
    const { t, locale } = useUi();
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string } }).flash;
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};

    const [audience, setAudience] = useState<Audience>(audiences[0] ?? 'women');
    const [busyKey, setBusyKey] = useState<MediaKey | null>(null);
    const [lastSaved, setLastSaved] = useState<MediaKey | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('nav.site_media'), href: '#' },
    ];

    const slots = initialMedia[audience] ?? {};
    const audienceLabel =
        locale === 'en' ? AUDIENCE_META[audience].en : AUDIENCE_META[audience].it;
    const storefrontLocale = locale === 'en' ? 'en' : 'it';
    const welcomeUrl = `${storefrontUrl}${AUDIENCE_META[audience].welcomePath}`;
    const homeUrl = `${storefrontUrl}${AUDIENCE_META[audience].homePath(storefrontLocale)}`;

    const dropLabels = {
        changeLabel: t('site_media.change'),
        clearLabel: t('site_media.clear'),
        uploadingLabel: t('site_media.uploading'),
    };

    const uploadFile = (key: MediaKey, file: File) => {
        setBusyKey(key);
        setLastSaved(null);
        const form = new FormData();
        form.append('audience', audience);
        form.append('key', key);
        form.append('file', file);

        router.post(`/${locale}/site-media`, form, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setBusyKey(null),
            onSuccess: () => setLastSaved(key),
        });
    };

    const clearSlot = (key: MediaKey) => {
        setBusyKey(key);
        setLastSaved(null);
        const form = new FormData();
        form.append('audience', audience);
        form.append('key', key);
        form.append('clear', '1');

        router.post(`/${locale}/site-media`, form, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setBusyKey(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('nav.site_media')} - HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-beige-light">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl space-y-2">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-burgundy">
                            {t('nav.site_media')}
                        </h1>
                        <p className="text-base text-gray-700 font-sans">
                            {t('site_media.subtitle')}
                        </p>
                        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 font-sans">
                            <li>{t('site_media.step_audience')}</li>
                            <li>{t('site_media.step_click')}</li>
                            <li>{t('site_media.step_auto')}</li>
                        </ol>
                    </div>
                </div>

                {(flash?.success || lastSaved) && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 font-sans">
                        <span>{flash?.success || t('site_media.updated')}</span>
                        <div className="flex flex-wrap gap-2">
                            {(lastSaved === 'welcome' || !lastSaved) && (
                                <a
                                    href={welcomeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-900 hover:bg-emerald-100"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {t('site_media.view_welcome')}
                                </a>
                            )}
                            {(lastSaved === 'home_still' ||
                                lastSaved === 'home_video_mp4' ||
                                lastSaved === 'home_video_webm' ||
                                lastSaved === 'new_arrivals_still' ||
                                (lastSaved !== null &&
                                    INSTAGRAM_KEYS.includes(lastSaved)) ||
                                !lastSaved) && (
                                <a
                                    href={homeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-emerald-900 hover:bg-emerald-100"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {t('site_media.view_home')}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {errors.file ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 font-sans">
                        {errors.file}
                    </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-sans font-semibold uppercase tracking-wide text-gray-500">
                        {t('site_media.audience_label')}
                    </span>
                    {audiences.map((a) => {
                        const label = locale === 'en' ? AUDIENCE_META[a].en : AUDIENCE_META[a].it;
                        const active = audience === a;
                        return (
                            <Button
                                key={a}
                                type="button"
                                variant={active ? 'default' : 'outline'}
                                onClick={() => {
                                    setAudience(a);
                                    setLastSaved(null);
                                }}
                                className={
                                    active
                                        ? 'bg-burgundy text-white hover:bg-burgundy-dark'
                                        : 'border-gray-300'
                                }
                            >
                                {label}
                            </Button>
                        );
                    })}
                    <span className="ml-1 text-sm text-gray-600 font-sans">
                        — <strong className="text-burgundy">{audienceLabel}</strong>
                    </span>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    {/* Welcome */}
                    <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-100 space-y-1">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                {t('site_media.welcome_title')}
                            </CardTitle>
                            <p className="text-sm text-gray-600 font-sans">
                                {t('site_media.welcome_desc')}
                            </p>
                            <a
                                href={welcomeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex w-fit items-center gap-1 text-xs font-sans text-burgundy underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                {t('site_media.used_on_welcome')}
                            </a>
                        </CardHeader>
                        <CardContent className="bg-white pt-5 space-y-3">
                            <DropZone
                                previewUrl={slots.welcome?.url ?? null}
                                busy={busyKey === 'welcome'}
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                emptyLabel={t('site_media.click_upload_image')}
                                hint={t('site_media.hint_image')}
                                canClear={Boolean(slots.welcome?.path)}
                                onFile={(file) => uploadFile('welcome', file)}
                                onClear={() => clearSlot('welcome')}
                                {...dropLabels}
                            />
                        </CardContent>
                    </Card>

                    {/* Home hero */}
                    <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-100 space-y-1">
                            <CardTitle className="text-xl font-serif font-bold text-burgundy">
                                {t('site_media.home_title')}
                            </CardTitle>
                            <p className="text-sm text-gray-600 font-sans">
                                {t('site_media.home_desc')}
                            </p>
                            <a
                                href={homeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex w-fit items-center gap-1 text-xs font-sans text-burgundy underline"
                            >
                                <ExternalLink className="h-3 w-3" />
                                {locale === 'en'
                                    ? `Open ${audienceLabel} home`
                                    : `Apri home ${audienceLabel}`}
                            </a>
                        </CardHeader>
                        <CardContent className="bg-white pt-5 space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm font-sans font-semibold text-gray-800">
                                    {t('site_media.still_label')}
                                </p>
                                <DropZone
                                    previewUrl={slots.home_still?.url ?? null}
                                    busy={busyKey === 'home_still'}
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    emptyLabel={t('site_media.click_upload_image')}
                                    hint={t('site_media.hint_image')}
                                    canClear={Boolean(slots.home_still?.path)}
                                    onFile={(file) => uploadFile('home_still', file)}
                                    onClear={() => clearSlot('home_still')}
                                    {...dropLabels}
                                />
                            </div>

                            <div className="space-y-3 rounded-lg border border-dashed border-gray-200 bg-beige-light/40 p-4">
                                <div>
                                    <p className="text-sm font-sans font-semibold text-gray-800">
                                        {t('site_media.video_optional')}
                                    </p>
                                    <p className="text-xs text-gray-500 font-sans">
                                        {t('site_media.video_hint')}
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-sans font-semibold uppercase tracking-wide text-gray-500">
                                            MP4
                                        </p>
                                        <DropZone
                                            previewUrl={slots.home_video_mp4?.url ?? null}
                                            isVideo
                                            busy={busyKey === 'home_video_mp4'}
                                            accept="video/mp4"
                                            emptyLabel={t('site_media.click_upload_video')}
                                            hint={t('site_media.hint_mp4')}
                                            canClear={Boolean(slots.home_video_mp4?.path)}
                                            onFile={(file) => uploadFile('home_video_mp4', file)}
                                            onClear={() => clearSlot('home_video_mp4')}
                                            {...dropLabels}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-sans font-semibold uppercase tracking-wide text-gray-500">
                                            WebM
                                        </p>
                                        <DropZone
                                            previewUrl={slots.home_video_webm?.url ?? null}
                                            isVideo
                                            busy={busyKey === 'home_video_webm'}
                                            accept="video/webm"
                                            emptyLabel={t('site_media.click_upload_video')}
                                            hint={t('site_media.hint_webm')}
                                            canClear={Boolean(slots.home_video_webm?.path)}
                                            onFile={(file) => uploadFile('home_video_webm', file)}
                                            onClear={() => clearSlot('home_video_webm')}
                                            {...dropLabels}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 space-y-1">
                        <CardTitle className="text-xl font-serif font-bold text-burgundy">
                            {t('site_media.new_arrivals_title')}
                        </CardTitle>
                        <p className="text-sm text-gray-600 font-sans">
                            {t('site_media.new_arrivals_desc')}
                        </p>
                        <a
                            href={homeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-1 text-xs font-sans text-burgundy underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {t('site_media.used_on_new_arrivals')} {audienceLabel}
                        </a>
                    </CardHeader>
                    <CardContent className="bg-white pt-5 max-w-xl">
                        <DropZone
                            previewUrl={slots.new_arrivals_still?.url ?? null}
                            busy={busyKey === 'new_arrivals_still'}
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            emptyLabel={t('site_media.click_upload_image')}
                            hint={t('site_media.hint_image_portrait')}
                            canClear={Boolean(slots.new_arrivals_still?.path)}
                            onFile={(file) => uploadFile('new_arrivals_still', file)}
                            onClear={() => clearSlot('new_arrivals_still')}
                            {...dropLabels}
                        />
                    </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm rounded-lg overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 space-y-1">
                        <CardTitle className="text-xl font-serif font-bold text-burgundy">
                            {t('site_media.instagram_title')}
                        </CardTitle>
                        <p className="text-sm text-gray-600 font-sans">
                            {t('site_media.instagram_desc')}
                        </p>
                        <a
                            href={homeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-fit items-center gap-1 text-xs font-sans text-burgundy underline"
                        >
                            <ExternalLink className="h-3 w-3" />
                            {t('site_media.used_on_instagram')} {audienceLabel}
                        </a>
                    </CardHeader>
                    <CardContent className="bg-white pt-5">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {INSTAGRAM_KEYS.map((key, index) => (
                                <div key={key} className="space-y-2">
                                    <p className="text-xs font-sans font-semibold uppercase tracking-wide text-gray-500">
                                        {t('site_media.instagram_slot').replace(
                                            '{n}',
                                            String(index + 1),
                                        )}
                                    </p>
                                    <DropZone
                                        previewUrl={slots[key]?.url ?? null}
                                        busy={busyKey === key}
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        emptyLabel={t('site_media.click_upload_image')}
                                        hint={t('site_media.hint_image')}
                                        canClear={Boolean(slots[key]?.path)}
                                        onFile={(file) => uploadFile(key, file)}
                                        onClear={() => clearSlot(key)}
                                        {...dropLabels}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
