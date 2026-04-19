/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Head } from '@inertiajs/react';
import { Printer, Download } from 'lucide-react';
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
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title={`Bon de Commande ${command.reference} - HARIMI`} />
            
            {/* Print Controls - Hidden when printing */}
            <div className="no-print fixed top-4 right-4 z-50 flex gap-2 bg-white p-4 rounded-2xl shadow-lg border border-border/80">
                <Button onClick={handlePrint} className="bg-burgundy text-white hover:bg-burgundy-dark">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimer
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="border-gray-300"
                >
                    Retour
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
                            <p className="text-sm text-gray-600">
                                Boutique de lingerie et accessoires
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="font-serif text-3xl font-bold text-burgundy mb-2 print:text-black">
                                BON DE COMMANDE
                            </h2>
                            <p className="text-sm text-gray-600">
                                Document officiel
                            </p>
                        </div>
                    </div>
                </div>

                {/* Command Info */}
                <div className="mb-8 grid grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Informations de la commande
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-600">Référence:</span>
                                <span className="ml-2 font-semibold text-gray-900">
                                    {command.reference}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Date:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                    {new Date(command.created_at).toLocaleDateString('fr-FR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600">Statut:</span>
                                <span className="ml-2 font-medium text-gray-900 capitalize">
                                    {command.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Client
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
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Produit
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Variante
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Quantité
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Prix unitaire
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Total
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
                                        {parseFloat(item.unit_price).toLocaleString('fr-FR', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </td>
                                    <td className="px-4 py-4 text-sm font-medium text-right text-gray-900">
                                        {parseFloat(item.total_price).toLocaleString('fr-FR', {
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
                                    TOTAL
                                </td>
                                <td className="px-4 py-4 text-right text-lg font-bold text-burgundy">
                                    {parseFloat(command.total_amount).toLocaleString('fr-FR', {
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
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                            Notes
                        </h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {command.notes}
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t-2 border-gray-300">
                    <div className="text-center text-xs text-gray-500 space-y-1">
                        <p className="font-medium">
                            Document généré automatiquement
                        </p>
                        <p>
                            HARIMI - Boutique de lingerie et accessoires
                        </p>
                        <p>
                            Email: contact@harimi.com | Tél: +33 1 23 45 67 89
                        </p>
                        <p className="mt-4">
                            Généré le {new Date().toLocaleString('fr-FR')}
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

