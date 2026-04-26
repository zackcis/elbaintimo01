/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Package,
    Users,
    AlertTriangle,
    FileText,
    Clock,
    Euro,
    Activity,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DashboardStatsSkeleton } from '@/components/skeleton-loaders';

interface DashboardStats {
    total_products: number;
    total_categories: number;
    total_variants: number;
    total_clients: number;
    total_stock: number;
    low_stock_variants: number;
    total_commands_this_month: number;
    chiffre_affaires: number;
    pending_commands: number;
    critical_stock: number;
}

interface RecentActivity {
    id: number;
    description?: string;
    user_name: string;
    created_at: string;
    entity_type?: string;
    action?: string;
}

interface DashboardProps {
    stats: DashboardStats;
    recentActivities?: RecentActivity[];
}

type StatCard = {
    id: string;
    title: string;
    value: string | number;
    icon: typeof Package;
    description: string;
    color: string;
    bgColor: string;
    showLowStockBadge?: boolean;
};

export default function Dashboard({ stats, recentActivities = [] }: DashboardProps) {
    const { t, locale } = useUi();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            {
                title: t('breadcrumb.dashboard'),
                href: dashboard().url,
            },
        ],
        [t],
    );

    const statCards: StatCard[] = useMemo(
        () => [
            {
                id: 'commands_month',
                title: t('dashboard.commands_month'),
                value: stats.total_commands_this_month,
                icon: FileText,
                description: t('dashboard.commands_month_desc'),
                color: 'text-burgundy',
                bgColor: 'bg-burgundy/10',
            },
            {
                id: 'revenue',
                title: t('dashboard.revenue'),
                value: Number(stats.chiffre_affaires).toLocaleString(dateLocale, {
                    style: 'currency',
                    currency: 'EUR',
                }),
                icon: Euro,
                description: t('dashboard.revenue_desc'),
                color: 'text-burgundy',
                bgColor: 'bg-burgundy/10',
            },
            {
                id: 'pending',
                title: t('dashboard.pending'),
                value: stats.pending_commands,
                icon: Clock,
                description: t('dashboard.pending_desc'),
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
            },
            {
                id: 'critical_stock',
                title: t('dashboard.critical_stock'),
                value: stats.critical_stock,
                icon: AlertTriangle,
                description: t('dashboard.critical_stock_desc'),
                color: 'text-red-600',
                bgColor: 'bg-red-100',
            },
            {
                id: 'total_products',
                title: t('dashboard.total_products'),
                value: stats.total_products,
                icon: Package,
                description: t('dashboard.total_products_desc'),
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
            },
            {
                id: 'total_clients',
                title: t('dashboard.total_clients'),
                value: stats.total_clients,
                icon: Users,
                description: t('dashboard.total_clients_desc'),
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
            },
            {
                id: 'low_stock',
                title: t('dashboard.low_stock'),
                value: stats.low_stock_variants,
                icon: AlertTriangle,
                description: t('dashboard.low_stock_desc'),
                color: 'text-amber-600',
                bgColor: 'bg-amber-100',
                showLowStockBadge: true,
            },
        ],
        [t, stats, dateLocale],
    );

    useEffect(() => {
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 300);

        const animationTimer = setTimeout(() => {
            setIsLoaded(true);
        }, 350);

        return () => {
            clearTimeout(loadingTimer);
            clearTimeout(animationTimer);
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('dashboard.title')} — HARIMI`} />
            <div className="flex h-full flex-1 flex-col gap-6 bg-beige/30 p-8">
                <div className="mb-2">
                    <h1 className="mb-1 font-serif text-3xl font-semibold text-foreground">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
                </div>

                {isLoading ? (
                    <DashboardStatsSkeleton />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {statCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card
                                    key={stat.id}
                                    className={`border-border/80 transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
                                        isLoaded
                                            ? 'translate-y-0 opacity-100'
                                            : 'translate-y-4 opacity-0'
                                    }`}
                                    style={{
                                        transitionDelay: `${index * 50}ms`,
                                    }}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {stat.title}
                                        </CardTitle>
                                        <div className="rounded-xl bg-burgundy/10 p-2.5">
                                            <Icon className="h-5 w-5 text-burgundy" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-baseline gap-2">
                                            <div className="font-serif text-2xl font-semibold text-foreground">
                                                {stat.value}
                                            </div>
                                            {stat.showLowStockBadge && stats.low_stock_variants > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    {t('dashboard.alert_badge')}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {!isLoading && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="font-serif text-lg font-semibold text-foreground">
                                    {t('dashboard.overview')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-border py-3">
                                        <span className="text-sm text-muted-foreground">
                                            {t('dashboard.avg_stock_per_variant')}
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_variants > 0
                                                ? Math.round(stats.total_stock / stats.total_variants).toLocaleString(
                                                      dateLocale,
                                                  )
                                                : 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-border py-3">
                                        <span className="text-sm text-muted-foreground">
                                            {t('dashboard.products_per_category')}
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_categories > 0
                                                ? (stats.total_products / stats.total_categories).toFixed(1)
                                                : 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-sm text-muted-foreground">
                                            {t('dashboard.variants_per_product')}
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_products > 0
                                                ? (stats.total_variants / stats.total_products).toFixed(1)
                                                : 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
                                    <Activity className="h-5 w-5 text-burgundy" />
                                    {t('dashboard.recent_activity')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentActivities.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t('dashboard.no_activity')}
                                    </p>
                                ) : (
                                    <div className="max-h-96 space-y-3 overflow-y-auto">
                                        {recentActivities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 rounded-xl border border-border/80 bg-beige/50 p-3"
                                            >
                                                <div className="shrink-0 rounded-lg bg-burgundy/10 p-1.5">
                                                    <Activity className="h-3.5 w-3.5 text-burgundy" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {activity.description ||
                                                            `${activity.entity_type} ${activity.action}`}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">
                                                            {activity.user_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/70">•</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(activity.created_at).toLocaleString(dateLocale, {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
