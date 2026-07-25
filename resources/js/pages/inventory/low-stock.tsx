import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import AppLayout from '@/layouts/app-layout';
import { useUi } from '@/hooks/use-ui';
import { dashboard } from '@/routes';
import { edit as productEdit } from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Package } from 'lucide-react';

type LowStockVariant = {
    id: number;
    product_id: number;
    product_title: string;
    brand_name: string | null;
    size: string | null;
    color: string | null;
    color_hex: string | null;
    stock: number;
    price: string;
    is_out_of_stock: boolean;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type Props = {
    variants: Paginated<LowStockVariant>;
    threshold: number;
    filter: 'all' | 'out' | 'low';
    counts: { all: number; out: number; low: number };
};

export default function LowStockPage({ variants, threshold, filter, counts }: Props) {
    const { t, locale } = useUi();
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('inventory.low_stock_title'), href: '#' },
    ];

    const setFilter = (next: Props['filter']) => {
        router.get(
            `/${locale}/inventory/low-stock`,
            next === 'all' ? {} : { filter: next },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('inventory.low_stock_title')} - HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            {t('inventory.low_stock_title')}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {t('inventory.low_stock_subtitle').replace('{threshold}', String(threshold))}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(
                            [
                                ['all', counts.all],
                                ['out', counts.out],
                                ['low', counts.low],
                            ] as const
                        ).map(([key, count]) => (
                            <Button
                                key={key}
                                type="button"
                                variant={filter === key ? 'default' : 'outline'}
                                className={
                                    filter === key
                                        ? 'bg-burgundy hover:bg-burgundy-dark'
                                        : 'border-gray-300'
                                }
                                onClick={() => setFilter(key)}
                            >
                                {t(`inventory.filter_${key}`)} ({count})
                            </Button>
                        ))}
                    </div>
                </div>

                {variants.data.length === 0 ? (
                    <Card className="border-border/80">
                        <CardContent>
                            <EmptyState
                                icon={Package}
                                title={t('inventory.empty_title')}
                                description={t('inventory.empty_desc')}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/80 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                            {t('invoice.product')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                                            {t('invoice.variant')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                                            {t('products.show.stock')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                                            {t('invoice.unit_price')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {variants.data.map((variant) => (
                                        <tr key={variant.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {variant.product_title}
                                                </div>
                                                {variant.brand_name ? (
                                                    <div className="text-xs text-gray-500">{variant.brand_name}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    {variant.color_hex ? (
                                                        <span
                                                            className="inline-block h-3 w-3 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: variant.color_hex }}
                                                        />
                                                    ) : null}
                                                    <span>
                                                        {[variant.color, variant.size].filter(Boolean).join(' / ') ||
                                                            '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Badge
                                                    className={`border text-xs ${
                                                        variant.is_out_of_stock
                                                            ? 'bg-red-100 text-red-700 border-red-200'
                                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                                    }`}
                                                >
                                                    {variant.is_out_of_stock ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {t('products.show.stock_status.out_of_stock')}
                                                        </span>
                                                    ) : (
                                                        `${variant.stock}`
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                {Number(variant.price).toLocaleString(dateLocale, {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={productEdit.url({ product: variant.product_id })}
                                                    className="text-sm text-burgundy hover:underline"
                                                >
                                                    {t('common.edit')}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {variants.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 text-sm text-gray-600">
                                <span>
                                    {variants.data.length} / {variants.total}
                                </span>
                                <div className="flex gap-2">
                                    {variants.links.map((link, index) =>
                                        link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`rounded border px-3 py-1 ${
                                                    link.active
                                                        ? 'border-burgundy bg-burgundy text-white'
                                                        : 'border-gray-300 bg-white'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className="px-3 py-1 text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
