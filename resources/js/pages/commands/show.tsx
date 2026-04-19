/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';

const commandsIndex = () => ({ url: '/commands' });
import { ArrowLeft, Download, FileText, Mail, User, Calendar, Edit, Trash2, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Commandes',
        href: commandsIndex().url,
    },
];

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
    const toast = useToast();
    const page = usePage();
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [status, setStatus] = useState(command.status);

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
                return 'En attente';
            case 'confirmed':
                return 'Confirmée';
            case 'shipped':
                return 'Expédiée';
            case 'cancelled':
                return 'Annulée';
            default:
                return status;
        }
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        router.put(`/commands/${command.id}`, {
            client_name: command.client_name,
            client_email: command.client_email,
            status: newStatus,
            notes: command.notes,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Statut mis à jour avec succès.');
            },
        });
    };

    const handleDelete = () => {
        setDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(`/commands/${command.id}`, {
            onSuccess: () => {
                toast.success('Commande supprimée avec succès.');
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
            <Head title={`${command.reference} - HARIMI`} />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={confirmDelete}
                title="Supprimer la commande"
                description="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
                confirmText="Supprimer"
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
                            Retour aux commandes
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
                            Créée le {new Date(command.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/commands/${command.id}/invoice`}>
                            <Button variant="outline" className="border-gray-300">
                                <FileText className="h-4 w-4 mr-2" />
                                Bon de commande
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="border-gray-300"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer
                        </Button>
                        <Link href={`/commands/${command.id}/edit`}>
                            <Button variant="outline" className="border-gray-300">
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
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
                                    Informations client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <User className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Nom</p>
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
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {command.client_email}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Management */}
                        <Card className="border-border/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Gestion du statut
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                            Changer le statut
                                        </Label>
                                        <select
                                            value={status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="confirmed">Confirmée</option>
                                            <option value="shipped">Expédiée</option>
                                            <option value="cancelled">Annulée</option>
                                        </select>
                                    </div>

                                    {/* Status Timeline */}
                                    <div className="pt-4 border-t border-border/80 space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">Créée:</span>
                                            <span className="font-medium text-gray-900">
                                                {new Date(command.created_at).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        {command.confirmed_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                <span className="text-gray-600">Confirmée:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.confirmed_at).toLocaleString('fr-FR')}
                                                </span>
                                            </div>
                                        )}
                                        {command.shipped_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                <span className="text-gray-600">Expédiée:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.shipped_at).toLocaleString('fr-FR')}
                                                </span>
                                            </div>
                                        )}
                                        {command.cancelled_at && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                                <span className="text-gray-600">Annulée:</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(command.cancelled_at).toLocaleString('fr-FR')}
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
                                    Articles de la commande
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-border/80">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    Produit
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    Variante
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    Quantité
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    Prix unitaire
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                                    Total
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
                                                            {parseFloat(item.unit_price).toLocaleString('fr-FR', {
                                                                style: 'currency',
                                                                currency: 'EUR',
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {parseFloat(item.total_price).toLocaleString('fr-FR', {
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
                                                    Total
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-lg font-bold text-burgundy">
                                                        {parseFloat(command.total_amount).toLocaleString('fr-FR', {
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
                                        Notes
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
                                    Résumé
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Sous-total</span>
                                    <span className="font-medium text-gray-900">
                                        {parseFloat(command.total_amount).toLocaleString('fr-FR', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">TVA</span>
                                    <span className="font-medium text-gray-900">0,00 €</span>
                                </div>
                                <div className="pt-4 border-t border-border/80 flex justify-between">
                                    <span className="text-base font-semibold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-burgundy">
                                        {parseFloat(command.total_amount).toLocaleString('fr-FR', {
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
                                    Actions rapides
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/commands/${command.id}/invoice`} className="block">
                                    <Button variant="outline" className="w-full justify-start border-gray-300">
                                        <Download className="h-4 w-4 mr-2" />
                                        Télécharger PDF
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => window.print()}
                                    className="w-full justify-start border-gray-300"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimer
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

