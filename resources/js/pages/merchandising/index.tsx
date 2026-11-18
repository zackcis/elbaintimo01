/* REDESIGN: merchandising sections — titles, rules, pins (CMS v1) */
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { useUi } from '@/hooks/use-ui';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type ShelfKey = 'best_sellers' | 'new_arrivals' | 'featured' | 'special_offers';
type PinMode = 'include' | 'exclude';
type Audience = 'women' | 'men' | 'kids';

const AUDIENCE_TABS: { id: Audience; it: string; en: string }[] = [
    { id: 'women', it: 'Donna', en: 'Women' },
    { id: 'men', it: 'Uomo', en: 'Men' },
    { id: 'kids', it: 'Bambini', en: 'Kids' },
];

interface PinProduct {
    product_id: number;
    title: string;
    is_published: boolean;
    image_path: string | null;
    position: number;
    mode: PinMode;
}

interface SectionRules {
    brand_ids: number[];
    category_ids: number[];
    on_sale: boolean;
    in_stock: boolean | null;
}

interface SectionState {
    id: number;
    slug: ShelfKey;
    title_it: string;
    title_en: string;
    audience: string | null;
    max_items: number;
    is_active: boolean;
    rules: SectionRules;
    pins: PinProduct[];
}

interface PublishedProduct {
    id: number;
    title: string;
    image_path: string | null;
    brand_id?: number | null;
    category_id?: number | null;
    in_stock?: boolean;
    on_sale?: boolean;
}

interface Option {
    id: number;
    name?: string;
    label?: string;
    parent_id?: number | null;
}

function expandCategoryIds(selected: number[], categories: Option[]): number[] {
    const children = new Map<number, number[]>();
    for (const c of categories) {
        const parent = c.parent_id ?? 0;
        const list = children.get(parent) ?? [];
        list.push(c.id);
        children.set(parent, list);
    }
    const out = new Set<number>();
    const walk = (id: number) => {
        if (out.has(id)) {
            return;
        }
        out.add(id);
        for (const child of children.get(id) ?? []) {
            walk(child);
        }
    };
    for (const id of selected) {
        walk(id);
    }
    return [...out];
}

function resolveShelfPreview(
    section: SectionState,
    publishedProducts: PublishedProduct[],
    categories: Option[],
    audienceCategoryIds: number[],
): PublishedProduct[] {
    const max = Math.max(1, Number(section.max_items) || 12);
    const audienceSet = new Set(audienceCategoryIds.map(Number));
    const inAudience = (p: PublishedProduct) =>
        audienceSet.size > 0 && audienceSet.has(Number(p.category_id));

    const excludeIds = new Set(
        section.pins.filter((p) => p.mode === 'exclude').map((p) => p.product_id),
    );
    const includePins = section.pins.filter((p) => p.mode === 'include');
    const byId = new Map(publishedProducts.map((p) => [p.id, p]));

    const ordered: PublishedProduct[] = [];
    const seen = new Set<number>();
    for (const pin of includePins) {
        if (excludeIds.has(pin.product_id) || seen.has(pin.product_id)) {
            continue;
        }
        const product = byId.get(pin.product_id);
        if (!product || !inAudience(product)) {
            continue;
        }
        ordered.push(product);
        seen.add(pin.product_id);
        if (ordered.length >= max) {
            return ordered;
        }
    }

    const brandIds = section.rules.brand_ids.map(Number).filter(Boolean);
    const categoryIds = expandCategoryIds(
        section.rules.category_ids.map(Number).filter(Boolean),
        categories,
    );
    const hasRules =
        brandIds.length > 0 ||
        categoryIds.length > 0 ||
        section.rules.on_sale ||
        section.rules.in_stock === true;

    if (!hasRules) {
        return ordered;
    }

    const matches = publishedProducts.filter((p) => {
        if (!inAudience(p) || seen.has(p.id) || excludeIds.has(p.id)) {
            return false;
        }
        if (brandIds.length > 0 && !brandIds.includes(Number(p.brand_id))) {
            return false;
        }
        if (categoryIds.length > 0 && !categoryIds.includes(Number(p.category_id))) {
            return false;
        }
        if (section.rules.on_sale && !p.on_sale) {
            return false;
        }
        if (section.rules.in_stock === true && !p.in_stock) {
            return false;
        }
        return true;
    });

    for (const product of matches) {
        ordered.push(product);
        if (ordered.length >= max) {
            break;
        }
    }

    return ordered;
}

interface MerchandisingPageProps {
    sections: SectionState[];
    shelfKeys: ShelfKey[];
    publishedProducts: PublishedProduct[];
    brands: Option[];
    categories: Option[];
    audience: Audience;
    audienceCategoryIds: number[];
    audiences: Audience[];
}

function hydrateSections(initialSections: SectionState[]): SectionState[] {
    return initialSections.map((s) => ({
        ...s,
        rules: {
            brand_ids: s.rules?.brand_ids ?? [],
            category_ids: s.rules?.category_ids ?? [],
            on_sale: Boolean(s.rules?.on_sale),
            in_stock: s.rules?.in_stock ?? null,
        },
        pins: s.pins ?? [],
    }));
}

export default function MerchandisingIndex({
    sections: initialSections,
    publishedProducts,
    brands,
    categories,
    audience,
    audienceCategoryIds,
}: MerchandisingPageProps) {
    const { t, locale } = useUi();
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string; error?: string } }).flash;
    const errors = (page.props as { errors?: Record<string, string | string[]> }).errors || {};
    const errorMessages = useMemo(
        () =>
            Object.entries(errors).flatMap(([key, value]) => {
                const messages = Array.isArray(value) ? value : [value];
                return messages.filter(Boolean).map((message) =>
                    key === 'sections' ? message : `${key}: ${message}`,
                );
            }),
        [errors],
    );

    const [sections, setSections] = useState<SectionState[]>(() => hydrateSections(initialSections));
    const [saving, setSaving] = useState(false);
    const [addSelection, setAddSelection] = useState<Record<string, string>>({});
    const [addMode, setAddMode] = useState<Record<string, PinMode>>({});

    useEffect(() => {
        setSections(hydrateSections(initialSections));
        setAddSelection({});
        setAddMode({});
    }, [initialSections, audience]);

    const audienceCategorySet = useMemo(
        () => new Set(audienceCategoryIds.map(Number)),
        [audienceCategoryIds],
    );

    const audienceProducts = useMemo(
        () =>
            publishedProducts.filter(
                (p) =>
                    audienceCategorySet.size > 0 &&
                    audienceCategorySet.has(Number(p.category_id)),
            ),
        [publishedProducts, audienceCategorySet],
    );

    const productById = useMemo(() => {
        const map = new Map<number, PublishedProduct>();
        for (const p of publishedProducts) {
            map.set(p.id, p);
        }
        for (const section of sections) {
            for (const pin of section.pins) {
                if (!map.has(pin.product_id)) {
                    map.set(pin.product_id, {
                        id: pin.product_id,
                        title: pin.title,
                        image_path: pin.image_path,
                    });
                }
            }
        }
        return map;
    }, [publishedProducts, sections]);

    const editingLabel = t(`merchandising.editing_${audience}`);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('nav.merchandising'), href: '#' },
    ];

    const switchAudience = (next: Audience) => {
        if (next === audience) {
            return;
        }
        router.get(
            '/' + locale + '/merchandising',
            { audience: next },
            { preserveScroll: true, preserveState: false },
        );
    };

    const updateSection = (slug: string, patch: Partial<SectionState>) => {
        setSections((prev) =>
            prev.map((s) => (s.slug === slug ? { ...s, ...patch } : s)),
        );
    };

    const updateRules = (slug: string, patch: Partial<SectionRules>) => {
        setSections((prev) =>
            prev.map((s) =>
                s.slug === slug ? { ...s, rules: { ...s.rules, ...patch } } : s,
            ),
        );
    };

    const movePin = (slug: string, index: number, direction: -1 | 1) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.slug !== slug) {
                    return s;
                }
                const pins = [...s.pins];
                const target = index + direction;
                if (target < 0 || target >= pins.length) {
                    return s;
                }
                [pins[index], pins[target]] = [pins[target], pins[index]];
                return { ...s, pins };
            }),
        );
    };

    const removePin = (slug: string, productId: number) => {
        setSections((prev) =>
            prev.map((s) =>
                s.slug === slug
                    ? { ...s, pins: s.pins.filter((p) => p.product_id !== productId) }
                    : s,
            ),
        );
    };

    const addPin = (slug: string) => {
        const raw = addSelection[slug];
        if (!raw) {
            return;
        }
        const id = Number(raw);
        if (!Number.isFinite(id)) {
            return;
        }
        const product = productById.get(id);
        const mode = addMode[slug] ?? 'include';

        setSections((prev) =>
            prev.map((s) => {
                if (s.slug !== slug) {
                    return s;
                }
                if (s.pins.some((p) => p.product_id === id)) {
                    return s;
                }
                return {
                    ...s,
                    pins: [
                        ...s.pins,
                        {
                            product_id: id,
                            title: product?.title ?? `#${id}`,
                            is_published: true,
                            image_path: product?.image_path ?? null,
                            position: s.pins.length,
                            mode,
                        },
                    ],
                };
            }),
        );
        setAddSelection((prev) => ({ ...prev, [slug]: '' }));
    };

    const toggleMulti = (
        slug: string,
        field: 'brand_ids' | 'category_ids',
        id: number,
    ) => {
        setSections((prev) =>
            prev.map((s) => {
                if (s.slug !== slug) {
                    return s;
                }
                const list = s.rules[field];
                const next = list.some((x) => Number(x) === Number(id))
                    ? list.filter((x) => Number(x) !== Number(id))
                    : [...list, Number(id)];
                return { ...s, rules: { ...s.rules, [field]: next } };
            }),
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.put(
            '/' + locale + '/merchandising',
            {
                audience,
                sections: sections.map((s) => {
                    const rules: Record<string, unknown> = {
                        brand_ids: s.rules.brand_ids.map(Number),
                        category_ids: s.rules.category_ids.map(Number),
                        on_sale: s.rules.on_sale ? 1 : 0,
                    };
                    if (s.rules.in_stock !== null) {
                        rules.in_stock = s.rules.in_stock ? 1 : 0;
                    }

                    return {
                        slug: s.slug,
                        title_it: s.title_it,
                        title_en: s.title_en,
                        max_items: Number(s.max_items) || 12,
                        is_active: s.is_active ? 1 : 0,
                        rules,
                        pins: s.pins.map((p) => ({
                            product_id: Number(p.product_id),
                            mode: p.mode,
                        })),
                    };
                }),
            },
            {
                preserveScroll: true,
                // Keep edits only when validation fails; otherwise reload from server props.
                preserveState: (pageResponse) =>
                    Object.keys((pageResponse.props as { errors?: object }).errors ?? {}).length > 0,
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('nav.merchandising')} - HARIMI`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="sticky top-0 z-10 -mx-4 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="font-serif text-2xl font-semibold text-burgundy">
                                {t('nav.merchandising')}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {editingLabel}
                            </p>
                        </div>
                        <Button
                            type="submit"
                            form="merchandising-form"
                            disabled={saving}
                            className="bg-burgundy hover:bg-burgundy-dark"
                        >
                            {saving ? '…' : t('common.save')}
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Audience">
                        {AUDIENCE_TABS.map((tab) => {
                            const active = tab.id === audience;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => switchAudience(tab.id)}
                                    className={
                                        active
                                            ? 'rounded-md bg-burgundy px-4 py-2 text-sm font-medium text-white'
                                            : 'rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-beige/60'
                                    }
                                >
                                    {locale === 'en' ? tab.en : tab.it}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {flash?.success && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </p>
                )}
                {flash?.error && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {flash.error}
                    </p>
                )}
                {errorMessages.length > 0 && (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                        <p className="font-medium">Save failed — fix the following:</p>
                        <ul className="mt-1 list-disc pl-5">
                            {errorMessages.map((message) => (
                                <li key={message}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form id="merchandising-form" onSubmit={handleSubmit} className="space-y-6">
                    {sections.map((section) => {
                        const pinnedIds = new Set(section.pins.map((p) => p.product_id));
                        const available = audienceProducts.filter((p) => !pinnedIds.has(p.id));
                        const preview = resolveShelfPreview(
                            section,
                            publishedProducts,
                            categories,
                            audienceCategoryIds,
                        );

                        return (
                            <Card key={section.slug} className="border-border/80 shadow-sm">
                                <CardHeader className="pb-3 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <CardTitle className="font-serif text-lg text-burgundy">
                                            {locale === 'en' ? section.title_en : section.title_it}
                                            <span className="ml-2 text-xs font-mono font-normal text-muted-foreground">
                                                {section.slug}
                                            </span>
                                        </CardTitle>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={section.is_active}
                                                onChange={(e) =>
                                                    updateSection(section.slug, {
                                                        is_active: e.target.checked,
                                                    })
                                                }
                                            />
                                            Active
                                        </label>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Title IT
                                            </Label>
                                            <Input
                                                value={section.title_it}
                                                onChange={(e) =>
                                                    updateSection(section.slug, {
                                                        title_it: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Title EN
                                            </Label>
                                            <Input
                                                value={section.title_en}
                                                onChange={(e) =>
                                                    updateSection(section.slug, {
                                                        title_en: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Max items
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={48}
                                                value={section.max_items}
                                                onChange={(e) =>
                                                    updateSection(section.slug, {
                                                        max_items: Number(e.target.value) || 12,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5">
                                    <div className="space-y-3 rounded-lg border border-border/70 p-3">
                                        <div>
                                            <p className="text-sm font-semibold">Rules (auto-fill)</p>
                                            <p className="text-xs text-muted-foreground">
                                                Match published products automatically after manual
                                                includes. Click Salva to publish.
                                            </p>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <Label className="text-xs text-muted-foreground">
                                                    Brands
                                                </Label>
                                                <div className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                                                    {brands.map((b) => (
                                                        <label
                                                            key={b.id}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={section.rules.brand_ids.some(
                                                                    (id) => Number(id) === Number(b.id),
                                                                )}
                                                                onChange={() =>
                                                                    toggleMulti(
                                                                        section.slug,
                                                                        'brand_ids',
                                                                        b.id,
                                                                    )
                                                                }
                                                            />
                                                            {b.name}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs text-muted-foreground">
                                                    Categories
                                                </Label>
                                                <div className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-md border border-border/60 p-2">
                                                    {categories.map((c) => (
                                                        <label
                                                            key={c.id}
                                                            className="flex items-center gap-2 text-sm"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={section.rules.category_ids.some(
                                                                    (id) => Number(id) === Number(c.id),
                                                                )}
                                                                onChange={() =>
                                                                    toggleMulti(
                                                                        section.slug,
                                                                        'category_ids',
                                                                        c.id,
                                                                    )
                                                                }
                                                            />
                                                            {c.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={section.rules.on_sale}
                                                    onChange={(e) =>
                                                        updateRules(section.slug, {
                                                            on_sale: e.target.checked,
                                                        })
                                                    }
                                                />
                                                On sale
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={section.rules.in_stock === true}
                                                    onChange={(e) =>
                                                        updateRules(section.slug, {
                                                            in_stock: e.target.checked
                                                                ? true
                                                                : null,
                                                        })
                                                    }
                                                />
                                                In stock only
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Shelf preview ({preview.length}/{section.max_items})
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                What the storefront will show after Salva — includes
                                                first, then rules, minus excludes.
                                            </p>
                                        </div>
                                        <ul className="divide-y divide-border/70 rounded-lg border border-dashed border-border/70 bg-beige/40">
                                            {preview.length === 0 ? (
                                                <li className="px-4 py-4 text-center text-sm text-muted-foreground">
                                                    No products match pins + rules yet.
                                                </li>
                                            ) : (
                                                preview.map((product, index) => (
                                                    <li
                                                        key={`preview-${section.slug}-${product.id}`}
                                                        className="flex items-center gap-3 px-3 py-2"
                                                    >
                                                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-beige">
                                                            {product.image_path ? (
                                                                <img
                                                                    src={`/storage/${product.image_path}`}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">
                                                                {product.title}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                #{index + 1}
                                                                {section.pins.some(
                                                                    (p) =>
                                                                        p.product_id === product.id &&
                                                                        p.mode === 'include',
                                                                )
                                                                    ? ' · pinned'
                                                                    : ' · auto-fill'}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-semibold">Manual pins</p>
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Include forces a product in; Exclude blocks it from rules.
                                        </p>
                                    <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
                                        {section.pins.length === 0 && (
                                            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                                                {t('merchandising.empty_shelf')}
                                            </li>
                                        )}
                                        {section.pins.map((pin, index) => {
                                            const product = productById.get(pin.product_id);
                                            return (
                                                <li
                                                    key={`${section.slug}-${pin.product_id}`}
                                                    className="flex items-center gap-3 px-3 py-2"
                                                >
                                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-beige">
                                                        {product?.image_path ? (
                                                            <img
                                                                src={`/storage/${product.image_path}`}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">
                                                            {product?.title ?? pin.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            #{index + 1} · {pin.mode}
                                                        </p>
                                                    </div>
                                                    <select
                                                        value={pin.mode}
                                                        onChange={(e) => {
                                                            const mode = e.target.value as PinMode;
                                                            setSections((prev) =>
                                                                prev.map((s) =>
                                                                    s.slug === section.slug
                                                                        ? {
                                                                              ...s,
                                                                              pins: s.pins.map(
                                                                                  (p, i) =>
                                                                                      i === index
                                                                                          ? {
                                                                                                ...p,
                                                                                                mode,
                                                                                            }
                                                                                          : p,
                                                                              ),
                                                                          }
                                                                        : s,
                                                                ),
                                                            );
                                                        }}
                                                        className="h-8 rounded-md border border-gray-300 px-2 text-xs"
                                                    >
                                                        <option value="include">Include</option>
                                                        <option value="exclude">Exclude</option>
                                                    </select>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={index === 0}
                                                            onClick={() =>
                                                                movePin(section.slug, index, -1)
                                                            }
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={
                                                                index === section.pins.length - 1
                                                            }
                                                            onClick={() =>
                                                                movePin(section.slug, index, 1)
                                                            }
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() =>
                                                                removePin(
                                                                    section.slug,
                                                                    pin.product_id,
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

                                    <div className="flex flex-wrap items-end gap-2">
                                        <div className="min-w-[200px] flex-1 grid gap-1.5">
                                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {t('merchandising.add_product')}
                                            </Label>
                                            <select
                                                value={addSelection[section.slug] ?? ''}
                                                onChange={(e) =>
                                                    setAddSelection((prev) => ({
                                                        ...prev,
                                                        [section.slug]: e.target.value,
                                                    }))
                                                }
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                                            >
                                                <option value="">
                                                    {t('merchandising.select_product')}
                                                </option>
                                                {available.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                                Mode
                                            </Label>
                                            <select
                                                value={addMode[section.slug] ?? 'include'}
                                                onChange={(e) =>
                                                    setAddMode((prev) => ({
                                                        ...prev,
                                                        [section.slug]: e.target
                                                            .value as PinMode,
                                                    }))
                                                }
                                                className="flex h-9 rounded-md border border-gray-300 px-2 text-sm"
                                            >
                                                <option value="include">Include</option>
                                                <option value="exclude">Exclude</option>
                                            </select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addPin(section.slug)}
                                            disabled={!addSelection[section.slug]}
                                        >
                                            <Plus className="mr-1 h-4 w-4" />
                                            {t('common.add')}
                                        </Button>
                                    </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </form>
            </div>
        </AppLayout>
    );
}
