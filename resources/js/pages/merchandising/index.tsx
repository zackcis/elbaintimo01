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
import { FormEvent, useMemo, useState } from 'react';

type ShelfKey = 'best_sellers' | 'new_arrivals' | 'featured' | 'special_offers';
type PinMode = 'include' | 'exclude';

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
}

interface Option {
    id: number;
    name?: string;
    label?: string;
}

interface MerchandisingPageProps {
    sections: SectionState[];
    shelfKeys: ShelfKey[];
    publishedProducts: PublishedProduct[];
    brands: Option[];
    categories: Option[];
}

export default function MerchandisingIndex({
    sections: initialSections,
    publishedProducts,
    brands,
    categories,
}: MerchandisingPageProps) {
    const { t, locale } = useUi();
    const page = usePage();
    const flash = (page.props as { flash?: { success?: string } }).flash;
    const errors = (page.props as { errors?: Record<string, string> }).errors || {};

    const [sections, setSections] = useState<SectionState[]>(() =>
        initialSections.map((s) => ({
            ...s,
            rules: {
                brand_ids: s.rules?.brand_ids ?? [],
                category_ids: s.rules?.category_ids ?? [],
                on_sale: Boolean(s.rules?.on_sale),
                in_stock: s.rules?.in_stock ?? null,
            },
            pins: s.pins ?? [],
        })),
    );

    const [addSelection, setAddSelection] = useState<Record<string, string>>({});
    const [addMode, setAddMode] = useState<Record<string, PinMode>>({});

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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('nav.merchandising'), href: '#' },
    ];

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
                const next = list.includes(id)
                    ? list.filter((x) => x !== id)
                    : [...list, id];
                return { ...s, rules: { ...s.rules, [field]: next } };
            }),
        );
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.put(
            '/' + locale + '/merchandising',
            {
                sections: sections.map((s) => ({
                    slug: s.slug,
                    title_it: s.title_it,
                    title_en: s.title_en,
                    audience: s.audience || null,
                    max_items: s.max_items,
                    is_active: s.is_active,
                    rules: {
                        brand_ids: s.rules.brand_ids,
                        category_ids: s.rules.category_ids,
                        on_sale: s.rules.on_sale,
                        in_stock: s.rules.in_stock,
                    },
                    pins: s.pins.map((p) => ({
                        product_id: p.product_id,
                        mode: p.mode,
                    })),
                })),
            },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('nav.merchandising')} - HARIMI`} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-burgundy">
                            {t('nav.merchandising')}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('merchandising.subtitle')}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        form="merchandising-form"
                        className="bg-burgundy hover:bg-burgundy-dark"
                    >
                        {t('common.save')}
                    </Button>
                </div>

                {flash?.success && (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </p>
                )}
                {errors.sections && (
                    <p className="text-sm text-destructive">{errors.sections}</p>
                )}

                <form id="merchandising-form" onSubmit={handleSubmit} className="space-y-6">
                    {sections.map((section) => {
                        const pinnedIds = new Set(section.pins.map((p) => p.product_id));
                        const available = publishedProducts.filter((p) => !pinnedIds.has(p.id));

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

                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
                                                Audience
                                            </Label>
                                            <select
                                                value={section.audience ?? ''}
                                                onChange={(e) =>
                                                    updateSection(section.slug, {
                                                        audience: e.target.value || null,
                                                    })
                                                }
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm"
                                            >
                                                <option value="">All</option>
                                                <option value="women">Women</option>
                                                <option value="men">Men</option>
                                                <option value="kids">Kids</option>
                                            </select>
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
                                        <p className="text-sm font-semibold">Rules (auto-fill)</p>
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
                                                                checked={section.rules.brand_ids.includes(
                                                                    b.id,
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
                                                                checked={section.rules.category_ids.includes(
                                                                    c.id,
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
                                </CardContent>
                            </Card>
                        );
                    })}
                </form>
            </div>
        </AppLayout>
    );
}
