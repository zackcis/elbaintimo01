/* REDESIGN: updated for ElbaIntimo UI refresh — kept props unchanged */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Package,
    ShoppingBag,
    Users,
    TrendingUp,
    AlertTriangle,
    Layers,
    Sparkles,
    FileText,
    Clock,
    Euro,
    Activity,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardStatsSkeleton } from '@/components/skeleton-loaders';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

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

export default function Dashboard({ stats, recentActivities = [] }: DashboardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Demo loading delay
        const loadingTimer = setTimeout(() => {
            setIsLoading(false);
        }, 300);

        // Trigger animation on mount
        const animationTimer = setTimeout(() => {
            setIsLoaded(true);
        }, 350);

        return () => {
            clearTimeout(loadingTimer);
            clearTimeout(animationTimer);
        };
    }, []);

    const statCards = [
        {
            title: 'Commandes ce mois',
            value: stats.total_commands_this_month,
            icon: FileText,
            description: 'Commandes créées ce mois',
            color: 'text-burgundy',
            bgColor: 'bg-burgundy/10',
        },
        {
            title: 'Chiffre d\'affaires',
            value: Number(stats.chiffre_affaires).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
            }),
            icon: Euro,
            description: 'CA du mois en cours',
            color: 'text-burgundy',
            bgColor: 'bg-burgundy/10',
        },
        {
            title: 'Commandes en attente',
            value: stats.pending_commands,
            icon: Clock,
            description: 'En attente de traitement',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            title: 'Stock critique',
            value: stats.critical_stock,
            icon: AlertTriangle,
            description: 'Produits < 10 unités',
            color: 'text-red-600',
            bgColor: 'bg-red-100',
        },
        {
            title: 'Total Produits',
            value: stats.total_products,
            icon: Package,
            description: 'Produits en catalogue',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
        {
            title: 'Total Clients',
            value: stats.total_clients,
            icon: Users,
            description: 'Clients enregistrés',
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de bord - ElbaIntimo" />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-beige/30">
                <div className="mb-2">
                    <h1 className="font-serif text-3xl font-semibold text-foreground mb-1">
                        Tableau de bord
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Vue d'ensemble de votre boutique
                    </p>
                </div>

                {isLoading ? (
                    <DashboardStatsSkeleton />
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={stat.title}
                                className={`border-border/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 ${
                                    isLoaded
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                }`}
                                style={{
                                    transitionDelay: `${index * 50}ms`,
                                }}
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-3">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div className="p-2.5 rounded-xl bg-burgundy/10">
                                        <Icon className="h-5 w-5 text-burgundy" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <div className="font-serif text-2xl font-semibold text-foreground">
                                            {stat.value}
                                        </div>
                                        {stat.title === 'Low Stock Items' && stats.low_stock_variants > 0 && (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Alerte
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {stat.description}
                                    </p>
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
                                    Vue d'ensemble
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-3 border-b border-border">
                                        <span className="text-sm text-muted-foreground">
                                            Stock moyen par variante
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_variants > 0
                                                ? Math.round(
                                                      stats.total_stock /
                                                          stats.total_variants,
                                                  ).toLocaleString()
                                                : 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-border">
                                        <span className="text-sm text-muted-foreground">
                                            Produits par catégorie
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_categories > 0
                                                ? (
                                                      stats.total_products /
                                                      stats.total_categories
                                                  ).toFixed(1)
                                                : 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-sm text-muted-foreground">
                                            Variantes par produit
                                        </span>
                                        <span className="text-sm font-semibold text-foreground">
                                            {stats.total_products > 0
                                                ? (
                                                      stats.total_variants /
                                                      stats.total_products
                                                  ).toFixed(1)
                                                : 0}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="font-serif text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-burgundy" />
                                    Activité récente
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentActivities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Aucune activité récente
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {recentActivities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 p-3 bg-beige/50 rounded-xl border border-border/80"
                                            >
                                                <div className="p-1.5 bg-burgundy/10 rounded-lg shrink-0">
                                                    <Activity className="h-3.5 w-3.5 text-burgundy" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {activity.description || `${activity.entity_type} ${activity.action}`}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {activity.user_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/70">•</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(activity.created_at).toLocaleString('fr-FR', {
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

