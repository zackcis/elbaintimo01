/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { useUi } from '@/hooks/use-ui';
import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    status: string;
    total_amount: string;
    notes: string | null;
    created_at: string;
    items: CommandItem[];
}

interface InvoiceProps {
    command: Command;
}

export default function Invoice({ command }: InvoiceProps) {
    const { t, locale } = useUi();
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`${t('commands.invoice')} ${command.reference} — HARIMI`} />

            {/* Print Controls - Hidden when printing */}
            <div className="no-print fixed top-4 right-4 z-50 flex gap-2 rounded-2xl border border-border/80 bg-white p-4 shadow-lg">
                <Button onClick={handlePrint} className="bg-burgundy text-white hover:bg-burgundy-dark">
                    <Printer className="mr-2 h-4 w-4" />
                    {t('commands.print')}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="border-gray-300"
                >
                    {t('commands.back')}
                </Button>
            </div>

            {/* Invoice Document */}
            <div className="min-h-screen bg-white p-12 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-12 pb-8 border-b-2 border-gray-300">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="h-16 w-16 bg-burgundy rounded-lg mb-4 flex items-center justify-center">
                                <span className="text-white font-serif font-bold text-2xl tracking-tight">
                                    H
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                HARIMI
                            </h1>
                            <p className="text-sm text-gray-600">{t('invoice.company_tagline')}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="mb-2 font-serif text-3xl font-bold text-burgundy print:text-black">
                                {t('invoice.document_heading')}
                            </h2>
                            <p className="text-sm text-gray-600">{t('invoice.document_sub')}</p>
                        </div>
                    </div>
                </div>

                {/* Command Info */}
                <div className="mb-8 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                            {t('invoice.command_details')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-600">{t('invoice.reference')}:</span>
                                <span className="ml-2 font-semibold text-gray-900">
                                    {command.reference}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">{t('invoice.date')}:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {new Date(command.created_at).toLocaleDateString(dateLocale, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">{t('invoice.status')}:</span>
                                <span className="ml-2 font-medium capitalize text-gray-900">
                                    {command.status}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">{t('invoice.fulfillment_label')}:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {command.fulfillment_type === 'ship'
                                        ? t('invoice.ship_detail')
                                        : t('invoice.pickup_detail')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                            {t('invoice.client')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="font-medium text-gray-900">
                                {command.client_name}
                            </div>
                            <div className="text-gray-600">
                                {command.client_email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    {t('invoice.product')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    {t('invoice.variant')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    {t('invoice.qty')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    {t('invoice.unit_price')}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">
                                    {t('invoice.total')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {command.items.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className={`border-b border-gray-200 ${
                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    }`}
                                >
                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                        {item.product_name}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600">
                                        {item.variant || '-'}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right text-gray-900">
                                        {parseFloat(item.unit_price).toLocaleString(dateLocale, {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                                        {parseFloat(item.total_price).toLocaleString(dateLocale, {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 border-t-2 border-gray-300">
                                <td colSpan={4} className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                                    {t('invoice.total_row')}
                                </td>
                                <td className="px-4 py-4 text-right text-lg font-bold text-burgundy">
                                    {parseFloat(command.total_amount).toLocaleString(dateLocale, {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Notes */}
                {command.notes && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                            {t('invoice.notes')}
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {command.notes}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t-2 border-gray-300">
                    <div className="space-y-1 text-center text-xs text-gray-500">
                        <p className="font-medium">{t('invoice.footer_auto')}</p>
                        <p>{t('invoice.footer_brand_line')}</p>
                        <p>{t('invoice.footer_contact')}</p>
                        <p className="mt-4">
                            {t('invoice.footer_generated_on')}{' '}
                            {new Date().toLocaleString(dateLocale)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white;
                    }
                    @page {
                        margin: 2cm;
                    }
                }
            `}</style>
        </>
    );
}

