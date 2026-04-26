/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy as commandDestroy, edit as commandEdit, index as commandsIndex, invoice as commandInvoice, update as commandUpdate } from '@/routes/commands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, FileText, Mail, User, Calendar, Edit, Trash2, Printer, Package, Store } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';

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
    fulfillment_type: 'pickup' | 'ship';
    status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
    total_amount: string;
    notes: string | null;
    confirmed_at: string | null;
    shipped_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    updated_at: string;
    items: CommandItem[];
}

interface CommandsShowProps {
    command: Command;
}

export default function CommandsShow({ command }: CommandsShowProps) {
    const { t, locale } = useUi();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('commands.title'), href: commandsIndex().url },
    ];
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';
    const toast = useToast();
    const page = usePage();
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [status, setStatus] = useState(command.status);

    useEffect(() => {
        setStatus(command.status);
    }, [command.status]);

    const flash = (page.props as { flash?: { success?: string } }).flash;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

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

    const fulfillment = command.fulfillment_type ?? 'pickup';
    const fulfillmentLabel = fulfillment === 'ship' ? t('invoice.ship_detail') : t('invoice.pickup_detail');

    const handleStatusChange = (newStatus: Command['status']) => {
        setStatus(newStatus);
        router.put(commandUpdate.url({ command: command.id }), {
            client_name: command.client_name,
            client_email: command.client_email,
            fulfillment_type: command.fulfillment_type ?? 'pickup',
            status: newStatus,
            notes: command.notes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('commands.status_updated'));
            },
        });
    };

    const handleDelete = () => {
        setDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(commandDestroy.url({ command: command.id }), {
            onSuccess: () => {
                toast.success(t('commands.deleted_success'));
                router.visit(commandsIndex().url);
            },
        });
    };

    const breadcrumbsWithCommand: BreadcrumbItem[] = [
        ...breadcrumbs,
        {
            title: command.reference,
            href: '#',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbsWithCommand}>
            <Head title={`${t('commands.title')} ${command.reference} - HARIMI`} />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={confirmDelete}
                title={t('commands.delete_title')}
                description={t('commands.delete_desc')}
                confirmText={t('common.delete')}
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <Link
                            href={commandsIndex().url}
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('commands.back_to_orders')}
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-semibold text-gray-900">
                                {command.reference}
                            </h1>
                            <Badge className={`${getStatusColor(status)} border font-medium`}>
                                {getStatusLabel(status)}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            {t('commands.show.created_on')}{' '}
                            {new Date(command.created_at).toLocaleDateString(dateLocale, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={commandInvoice({ command: command.id }).url}>
                            <Button variant="outline" className="border-gray-300">
                                <FileText className="h-4 w-4 mr-2" />
                                {t('commands.invoice')}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="border-gray-300"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            {t('commands.print')}
                        </Button>
                        <Link href={commandEdit({ command: command.id }).url}>
                            <Button variant="outline" className="border-gray-300">
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client Information */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {t('commands.show.client_info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <User className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t('commands.show.name')}</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {command.client_name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Mail className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t('auth.register.email')}</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {command.client_email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        {fulfillment === 'ship' ? (
                                            <Package className="h-5 w-5 text-gray-600" />
                                        ) : (
                                            <Store className="h-5 w-5 text-gray-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">{t('invoice.fulfillment_label')}</p>
                                        <p className="text-base font-medium text-gray-900">{fulfillmentLabel}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Management */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {t('commands.show.status_management')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                            {t('commands.show.change_status')}
                                        </Label>
                                        <select
                                            value={status}
                                            onChange={(e) =>
                                                handleStatusChange(e.target.value as Command['status'])
                                            }
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                        >
                                            <option value="pending">{t('commands.status.pending')}</option>
                                            <option value="confirmed">{t('commands.status.confirmed')}</option>
                                            <option value="shipped">{t('commands.status.shipped')}</option>
                                            <option value="cancelled">{t('commands.status.cancelled')}</option>
                                        </select>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="pt-4 border-t border-border/80 space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{t('commands.show.created_label')}:</span>
                                            <span className="font-medium text-gray-900">
                                                {new Date(command.created_at).toLocaleString(dateLocale)}
                                            </span>
                                        </div>
                                        {command.confirmed_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="text-gray-600">{t('commands.status.confirmed')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.confirmed_at).toLocaleString(dateLocale)}
                                                </span>
                                            </div>
                                        )}
                                        {command.shipped_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-gray-600">{t('commands.status.shipped')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.shipped_at).toLocaleString(dateLocale)}
                                                </span>
                                            </div>
                                        )}
                                        {command.cancelled_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                <span className="text-gray-600">{t('commands.status.cancelled')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.cancelled_at).toLocaleString(dateLocale)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {t('commands.show.items')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-border/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    {t('invoice.product')}
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    {t('invoice.variant')}
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    {t('invoice.qty')}
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    {t('invoice.unit_price')}
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    {t('invoice.total')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {command.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {item.product_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-600">
                                                            {item.variant || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm text-gray-900">
                                                            {parseFloat(item.unit_price).toLocaleString(dateLocale, {
                                                                style: 'currency',
                                                                currency: 'EUR',
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {parseFloat(item.total_price).toLocaleString(dateLocale, {
                                                                style: 'currency',
                                                                currency: 'EUR',
                                                            })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                                                    {t('invoice.total')}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-lg font-bold text-burgundy">
                                                        {parseFloat(command.total_amount).toLocaleString(dateLocale, {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        })}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {command.notes && (
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('invoice.notes')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {command.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Order Summary */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {t('commands.show.summary')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{t('commands.show.subtotal')}</span>
                                    <span className="font-medium text-gray-900">
                                        {parseFloat(command.total_amount).toLocaleString(dateLocale, {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{t('commands.show.vat')}</span>
                                    <span className="font-medium text-gray-900">0,00 €</span>
                                </div>
                                <div className="pt-4 border-t border-border/80 flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">{t('invoice.total')}</span>
                                    <span className="text-xl font-bold text-burgundy">
                                        {parseFloat(command.total_amount).toLocaleString(dateLocale, {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    {t('commands.show.quick_actions')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={commandInvoice({ command: command.id }).url} className="block">
                                    <Button variant="outline" className="w-full justify-start border-gray-300">
                                        <Download className="h-4 w-4 mr-2" />
                                        {t('commands.show.download_pdf')}
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => window.print()}
                                    className="w-full justify-start border-gray-300"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    {t('commands.print')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

