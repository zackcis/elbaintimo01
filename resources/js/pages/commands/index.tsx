/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useUi } from '@/hooks/use-ui';
import { dashboard } from '@/routes';
import { create as commandsCreate, destroy as commandDestroy, index as commandsIndex, invoice as commandInvoice, show as commandShow } from '@/routes/commands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Plus, Search, Eye, Trash2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { EmptyState } from '@/components/empty-state';

interface CommandItem {
    id: number;
    product_name: string;
    variant: string | null;
    quantity: number;
    unit_price: string;
    total_price: string;
}

interface Command {
    id: number;
    reference: string;
    client_name: string;
    client_email: string;
    fulfillment_type?: 'pickup' | 'ship';
    status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
    payment_status?: string | null;
    source?: string | null;
    total_amount: string;
    notes: string | null;
    created_at: string;
    items?: CommandItem[];
}

interface CommandsData {
    data: Command[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
    }>;
}

interface CommandsFilters {
    q: string;
    payment_status: string;
    status: string;
    source: string;
}

interface CommandsProps {
    commands: CommandsData;
    filters: CommandsFilters;
}

export default function CommandsIndex({ commands, filters }: CommandsProps) {
    const { t, locale } = useUi();
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';
    const toast = useToast();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('commands.title'), href: commandsIndex().url },
    ];

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(filters?.q ?? '');
    const [paymentStatus, setPaymentStatus] = useState(filters?.payment_status ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');
    const [sourceFilter, setSourceFilter] = useState(filters?.source ?? '');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; commandId: number | null }>({
        open: false,
        commandId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        setSearchTerm(filters?.q ?? '');
        setPaymentStatus(filters?.payment_status ?? '');
        setStatusFilter(filters?.status ?? '');
        setSourceFilter(filters?.source ?? '');
    }, [filters]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'confirmed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'shipped':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-border/80';
        }
    };

    const getPaymentColor = (payment?: string | null) => {
        switch (payment) {
            case 'paid':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'refunded':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'pending_payment':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'failed':
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-border/80';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return t('commands.status.pending');
            case 'confirmed':
                return t('commands.status.confirmed');
            case 'shipped':
                return t('commands.status.shipped');
            case 'cancelled':
                return t('commands.status.cancelled');
            default:
                return status;
        }
    };

    const getPaymentLabel = (payment?: string | null) => {
        switch (payment) {
            case 'paid':
                return t('commands.payment.paid');
            case 'pending_payment':
                return t('commands.payment.pending_payment');
            case 'failed':
                return t('commands.payment.failed');
            case 'cancelled':
                return t('commands.payment.cancelled');
            case 'refunded':
                return t('commands.payment.refunded');
            case 'not_applicable':
                return t('commands.payment.not_applicable');
            default:
                return payment || t('commands.payment.not_applicable');
        }
    };

    const getSourceLabel = (source?: string | null) => {
        if (source === 'storefront') {
            return t('commands.source.storefront');
        }
        return t('commands.source.admin');
    };

    const applyFilters = (next: Partial<CommandsFilters>) => {
        const params: Record<string, string> = {};
        const merged = {
            q: searchTerm,
            payment_status: paymentStatus,
            status: statusFilter,
            source: sourceFilter,
            ...next,
        };
        if (merged.q) params.q = merged.q;
        if (merged.payment_status) params.payment_status = merged.payment_status;
        if (merged.status) params.status = merged.status;
        if (merged.source) params.source = merged.source;

        router.get(commandsIndex().url, params, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = (commandId: number) => {
        setDeleteDialog({ open: true, commandId });
    };

    const confirmDelete = () => {
        if (deleteDialog.commandId) {
            router.delete(commandDestroy.url({ command: deleteDialog.commandId }), {
                onSuccess: () => {
                    toast.success(t('commands.deleted_success'));
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('commands.title')} - HARIMI`} />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, commandId: null })}
                onConfirm={confirmDelete}
                title={t('commands.delete_title')}
                description={t('commands.delete_desc')}
                confirmText={t('common.delete')}
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                            {t('commands.title')}
                        </h1>
                        <p className="text-sm text-gray-600">
                            {commands.total} {t('commands.total_suffix')}
                        </p>
                    </div>
                    <Link href={commandsCreate().url}>
                        <Button className="bg-burgundy text-white hover:bg-burgundy-dark font-medium">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('commands.create')}
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <div className="relative md:col-span-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('commands.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    applyFilters({ q: searchTerm });
                                }
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-border/80 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy bg-white text-sm"
                        />
                    </div>
                    <select
                        value={paymentStatus}
                        onChange={(e) => {
                            setPaymentStatus(e.target.value);
                            applyFilters({ payment_status: e.target.value });
                        }}
                        className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
                    >
                        <option value="">{t('commands.filters.all_payments')}</option>
                        <option value="pending_payment">{t('commands.payment.pending_payment')}</option>
                        <option value="paid">{t('commands.payment.paid')}</option>
                        <option value="refunded">{t('commands.payment.refunded')}</option>
                        <option value="failed">{t('commands.payment.failed')}</option>
                        <option value="cancelled">{t('commands.payment.cancelled')}</option>
                        <option value="not_applicable">{t('commands.payment.not_applicable')}</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            applyFilters({ status: e.target.value });
                        }}
                        className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
                    >
                        <option value="">{t('commands.filters.all_statuses')}</option>
                        <option value="pending">{t('commands.status.pending')}</option>
                        <option value="confirmed">{t('commands.status.confirmed')}</option>
                        <option value="shipped">{t('commands.status.shipped')}</option>
                        <option value="cancelled">{t('commands.status.cancelled')}</option>
                    </select>
                    <select
                        value={sourceFilter}
                        onChange={(e) => {
                            setSourceFilter(e.target.value);
                            applyFilters({ source: e.target.value });
                        }}
                        className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
                    >
                        <option value="">{t('commands.filters.all_sources')}</option>
                        <option value="storefront">{t('commands.source.storefront')}</option>
                        <option value="admin">{t('commands.source.admin')}</option>
                    </select>
                </div>
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-gray-300"
                        onClick={() => applyFilters({ q: searchTerm })}
                    >
                        {t('commands.filters.apply')}
                    </Button>
                </div>

                {isLoading ? (
                    <ProductListSkeleton count={5} />
                ) : commands.data.length === 0 ? (
                    <Card className="border-border/80">
                        <CardContent>
                            <EmptyState
                                icon={FileText}
                                title={t('commands.empty_title')}
                                description={t('commands.empty_desc')}
                                actionLabel={t('commands.create')}
                                actionHref={commandsCreate().url}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border/80 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('invoice.reference')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('invoice.client')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('commands.filters.source')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('commands.filters.payment')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('invoice.status')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('invoice.total')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('invoice.date')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            {t('common.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {commands.data.map((command) => (
                                        <tr
                                            key={command.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {command.reference}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {command.client_name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {command.client_email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-xs font-medium text-gray-700">
                                                    {getSourceLabel(command.source)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    className={`${getPaymentColor(command.payment_status)} border font-medium text-xs`}
                                                >
                                                    {getPaymentLabel(command.payment_status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    className={`${getStatusColor(command.status)} border font-medium text-xs`}
                                                >
                                                    {getStatusLabel(command.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {parseFloat(command.total_amount).toLocaleString(dateLocale, {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(command.created_at).toLocaleDateString(dateLocale)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={commandShow({ command: command.id }).url}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title={t('common.view')}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={commandInvoice({ command: command.id }).url}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title={t('commands.invoice')}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(command.id)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {commands.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-border/80 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    {t('commands.pagination_showing')} {commands.data.length} / {commands.total}
                                </div>
                                <div className="flex gap-2">
                                    {commands.links.map((link, index) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 text-sm text-gray-400"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            );
                                        }
                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-1 text-sm rounded border transition-colors ${
                                                    link.active
                                                        ? 'bg-burgundy text-white border-burgundy'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
