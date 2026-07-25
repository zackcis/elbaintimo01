/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { destroy as commandDestroy, edit as commandEdit, index as commandsIndex, invoice as commandInvoice, refund as commandRefund, update as commandUpdate } from '@/routes/commands';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, FileText, Mail, User, Calendar, Edit, Trash2, Printer, Package, Store, Phone } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';

interface CommandItem {
    id: number;
    product_name: string;
    variant: string | null;
    size?: string | null;
    color?: string | null;
    quantity: number;
    unit_price: string;
    total_price: string;
}

interface Command {
    id: number;
    reference: string;
    client_name: string;
    client_email: string;
    client_phone?: string | null;
    fulfillment_type: 'pickup' | 'ship';
    status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
    payment_status?: string | null;
    source?: string | null;
    billing_same_as_shipping?: boolean;
    shipping_line1?: string | null;
    shipping_line2?: string | null;
    shipping_city?: string | null;
    shipping_province?: string | null;
    shipping_postal_code?: string | null;
    shipping_country?: string | null;
    shipping_carrier?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    billing_line1?: string | null;
    billing_line2?: string | null;
    billing_city?: string | null;
    billing_province?: string | null;
    billing_postal_code?: string | null;
    billing_country?: string | null;
    subtotal_amount?: string | null;
    shipping_amount?: string | null;
    tax_amount?: string | null;
    total_amount: string;
    stripe_checkout_session_id?: string | null;
    stripe_payment_intent_id?: string | null;
    stripe_refund_id?: string | null;
    paid_at?: string | null;
    refunded_at?: string | null;
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
    const [refundDialog, setRefundDialog] = useState(false);
    const [refundPending, setRefundPending] = useState(false);
    const [status, setStatus] = useState(command.status);
    const [carrier, setCarrier] = useState(command.shipping_carrier ?? '');
    const [trackingNumber, setTrackingNumber] = useState(command.tracking_number ?? '');
    const [trackingUrl, setTrackingUrl] = useState(command.tracking_url ?? '');
    const isStorefront = command.source === 'storefront';
    const isPaid = command.payment_status === 'paid';
    const isRefunded = command.payment_status === 'refunded';
    const isCancelled = command.status === 'cancelled';
    const isShipped = command.status === 'shipped';
    const canRefund = isStorefront && isPaid && !isRefunded;
    useEffect(() => {
        setStatus(command.status);
        setCarrier(command.shipping_carrier ?? '');
        setTrackingNumber(command.tracking_number ?? '');
        setTrackingUrl(command.tracking_url ?? '');
    }, [command.status, command.shipping_carrier, command.tracking_number, command.tracking_url]);

    const flash = (page.props as { flash?: { success?: string; error?: string } }).flash;
    const errors = (page.props as { errors?: Record<string, string> }).errors;
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (errors?.status) {
            toast.error(errors.status);
            setStatus(command.status);
        }
        if (errors?.items) {
            toast.error(errors.items);
        }
    }, [flash?.success, flash?.error, errors?.status, errors?.items, command.status]);

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

    const formatMoney = (value?: string | null) =>
        parseFloat(value || '0').toLocaleString(dateLocale, {
            style: 'currency',
            currency: 'EUR',
        });

    const fulfillment = command.fulfillment_type ?? 'pickup';
    const fulfillmentLabel = fulfillment === 'ship' ? t('invoice.ship_detail') : t('invoice.pickup_detail');

    const handleStatusChange = (newStatus: Command['status']) => {
        if (isStorefront && newStatus === 'shipped' && !isPaid) {
            toast.error(t('commands.errors.ship_requires_paid'));
            return;
        }
        if (isCancelled && newStatus !== 'cancelled') {
            toast.error(t('commands.errors.cannot_reactivate'));
            return;
        }
        if (isShipped && newStatus === 'cancelled') {
            toast.error(t('commands.errors.cannot_cancel_shipped'));
            return;
        }

        setStatus(newStatus);
        router.put(commandUpdate.url({ command: command.id }), {
            client_name: command.client_name,
            client_email: command.client_email,
            fulfillment_type: command.fulfillment_type ?? 'ship',
            status: newStatus,
            notes: command.notes,
            shipping_carrier: carrier || null,
            tracking_number: trackingNumber || null,
            tracking_url: trackingUrl || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('commands.status_updated'));
            },
            onError: (err) => {
                setStatus(command.status);
                if (err.status) {
                    toast.error(String(err.status));
                }
                if (err.tracking_url) {
                    toast.error(String(err.tracking_url));
                }
            },
        });
    };

    const saveTracking = () => {
        router.put(commandUpdate.url({ command: command.id }), {
            client_name: command.client_name,
            client_email: command.client_email,
            fulfillment_type: command.fulfillment_type ?? 'ship',
            status: command.status,
            notes: command.notes,
            shipping_carrier: carrier || null,
            tracking_number: trackingNumber || null,
            tracking_url: trackingUrl || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('commands.tracking_saved'));
            },
            onError: (err) => {
                if (err.tracking_url) {
                    toast.error(String(err.tracking_url));
                }
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

    const confirmRefund = () => {
        setRefundPending(true);
        router.post(commandRefund.url({ command: command.id }), {}, {
            preserveScroll: true,
            onFinish: () => {
                setRefundPending(false);
                setRefundDialog(false);
            },
            onSuccess: () => {
                toast.success(t('commands.refund_success'));
            },
            onError: (err) => {
                toast.error(String(err.payment || t('commands.refund_failed')));
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

    const hasShipping = Boolean(command.shipping_line1);

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
            <ConfirmationDialog
                open={refundDialog}
                onClose={() => !refundPending && setRefundDialog(false)}
                onConfirm={confirmRefund}
                title={t('commands.refund_title')}
                description={t('commands.refund_desc')}
                confirmText={refundPending ? t('commands.refund_pending') : t('commands.refund_confirm')}
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div className="flex items-start justify-between">
                    <div>
                        <Link
                            href={commandsIndex().url}
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {t('commands.back_to_orders')}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl font-semibold text-gray-900">
                                {command.reference}
                            </h1>
                            <Badge className={`${getStatusColor(status)} border font-medium`}>
                                {getStatusLabel(status)}
                            </Badge>
                            <Badge className={`${getPaymentColor(command.payment_status)} border font-medium`}>
                                {getPaymentLabel(command.payment_status)}
                            </Badge>
                            <Badge className="bg-gray-100 text-gray-700 border border-border/80 font-medium">
                                {isStorefront ? t('commands.source.storefront') : t('commands.source.admin')}
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
                        {!isStorefront && (
                            <Link href={commandEdit({ command: command.id }).url}>
                                <Button variant="outline" className="border-gray-300">
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                </Button>
                            </Link>
                        )}
                        {canRefund && (
                            <Button
                                variant="outline"
                                onClick={() => setRefundDialog(true)}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                                {t('commands.refund')}
                            </Button>
                        )}
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
                    <div className="lg:col-span-2 space-y-6">
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
                                {command.client_phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <Phone className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">{t('commands.show.phone')}</p>
                                            <p className="text-base font-medium text-gray-900">
                                                {command.client_phone}
                                            </p>
                                        </div>
                                    </div>
                                )}
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

                        {hasShipping && (
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('commands.show.shipping_address')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-gray-800 space-y-1">
                                    <p>{command.shipping_line1}</p>
                                    {command.shipping_line2 ? <p>{command.shipping_line2}</p> : null}
                                    <p>
                                        {command.shipping_postal_code} {command.shipping_city}
                                        {command.shipping_province ? ` (${command.shipping_province})` : ''}
                                    </p>
                                    <p>{command.shipping_country}</p>
                                    {!command.billing_same_as_shipping && command.billing_line1 ? (
                                        <div className="pt-4 mt-4 border-t border-border/80 space-y-1">
                                            <p className="font-medium text-gray-900 mb-2">
                                                {t('commands.show.billing_address')}
                                            </p>
                                            <p>{command.billing_line1}</p>
                                            {command.billing_line2 ? <p>{command.billing_line2}</p> : null}
                                            <p>
                                                {command.billing_postal_code} {command.billing_city}
                                                {command.billing_province ? ` (${command.billing_province})` : ''}
                                            </p>
                                            <p>{command.billing_country}</p>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        )}

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
                                            disabled={isCancelled}
                                            onChange={(e) =>
                                                handleStatusChange(e.target.value as Command['status'])
                                            }
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy disabled:opacity-60"
                                        >
                                            <option value="pending">{t('commands.status.pending')}</option>
                                            <option value="confirmed">{t('commands.status.confirmed')}</option>
                                            <option
                                                value="shipped"
                                                disabled={isStorefront && !isPaid}
                                            >
                                                {t('commands.status.shipped')}
                                                {isStorefront && !isPaid
                                                    ? ` (${t('commands.errors.ship_requires_paid_short')})`
                                                    : ''}
                                            </option>
                                            <option value="cancelled" disabled={isShipped}>
                                                {t('commands.status.cancelled')}
                                            </option>
                                        </select>
                                    </div>

                                    {!isCancelled && (
                                        <div className="space-y-3 rounded-md border border-border/80 bg-gray-50 p-4">
                                            <p className="text-sm font-medium text-gray-900">
                                                {t('commands.show.tracking')}
                                            </p>
                                            <div>
                                                <Label className="text-xs text-gray-600 mb-1 block">
                                                    {t('commands.show.carrier')}
                                                </Label>
                                                <input
                                                    value={carrier}
                                                    onChange={(e) => setCarrier(e.target.value)}
                                                    placeholder="BRT, GLS, Poste…"
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-600 mb-1 block">
                                                    {t('commands.show.tracking_number')}
                                                </Label>
                                                <input
                                                    value={trackingNumber}
                                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs text-gray-600 mb-1 block">
                                                    {t('commands.show.tracking_url')}
                                                </Label>
                                                <input
                                                    value={trackingUrl}
                                                    onChange={(e) => setTrackingUrl(e.target.value)}
                                                    placeholder="https://"
                                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="border-gray-300"
                                                onClick={saveTracking}
                                            >
                                                {t('commands.tracking_save')}
                                            </Button>
                                            <p className="text-xs text-gray-500">
                                                {t('commands.tracking_ship_hint')}
                                            </p>
                                        </div>
                                    )}

                                    {(command.tracking_number || command.shipping_carrier) && (
                                        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm">
                                            {command.shipping_carrier ? (
                                                <p>
                                                    <span className="text-gray-600">{t('commands.show.carrier')}: </span>
                                                    {command.shipping_carrier}
                                                </p>
                                            ) : null}
                                            {command.tracking_number ? (
                                                <p className="mt-1">
                                                    <span className="text-gray-600">{t('commands.show.tracking_number')}: </span>
                                                    {command.tracking_number}
                                                </p>
                                            ) : null}
                                            {command.tracking_url ? (
                                                <a
                                                    href={command.tracking_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-2 inline-block text-burgundy underline"
                                                >
                                                    {t('commands.show.track_shipment')}
                                                </a>
                                            ) : null}
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border/80 space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{t('commands.show.created_label')}:</span>
                                            <span className="font-medium text-gray-900">
                                                {new Date(command.created_at).toLocaleString(dateLocale)}
                                            </span>
                                        </div>
                                        {command.paid_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span className="text-gray-600">{t('commands.payment.paid')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.paid_at).toLocaleString(dateLocale)}
                                                </span>
                                            </div>
                                        )}
                                        {command.refunded_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                <span className="text-gray-600">{t('commands.payment.refunded')}:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.refunded_at).toLocaleString(dateLocale)}
                                                </span>
                                            </div>
                                        )}
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
                                                            {item.variant ||
                                                                [item.color, item.size].filter(Boolean).join(' / ') ||
                                                                '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm text-gray-900">
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm text-gray-900">
                                                            {formatMoney(item.unit_price)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {formatMoney(item.total_price)}
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
                                                        {formatMoney(command.total_amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

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

                    <div className="lg:col-span-1 space-y-6">
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
                                        {formatMoney(command.subtotal_amount ?? command.total_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{t('commands.show.shipping')}</span>
                                    <span className="font-medium text-gray-900">
                                        {formatMoney(command.shipping_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{t('commands.show.vat')}</span>
                                    <span className="font-medium text-gray-900">
                                        {formatMoney(command.tax_amount)}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-border/80 flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">{t('invoice.total')}</span>
                                    <span className="text-xl font-bold text-burgundy">
                                        {formatMoney(command.total_amount)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {(command.stripe_checkout_session_id || command.stripe_payment_intent_id || command.stripe_refund_id) && (
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('commands.show.payment_details')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">{t('commands.filters.payment')}</p>
                                        <p className="font-medium text-gray-900">
                                            {getPaymentLabel(command.payment_status)}
                                        </p>
                                    </div>
                                    {command.stripe_checkout_session_id && (
                                        <div>
                                            <p className="text-gray-600">{t('commands.show.stripe_session')}</p>
                                            <p className="font-mono text-xs break-all text-gray-900">
                                                {command.stripe_checkout_session_id}
                                            </p>
                                        </div>
                                    )}
                                    {command.stripe_payment_intent_id && (
                                        <div>
                                            <p className="text-gray-600">{t('commands.show.stripe_intent')}</p>
                                            <p className="font-mono text-xs break-all text-gray-900">
                                                {command.stripe_payment_intent_id}
                                            </p>
                                        </div>
                                    )}
                                    {command.stripe_refund_id && (
                                        <div>
                                            <p className="text-gray-600">{t('commands.show.stripe_refund')}</p>
                                            <p className="font-mono text-xs break-all text-gray-900">
                                                {command.stripe_refund_id}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
