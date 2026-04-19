/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const commandsIndex = () => ({ url: '/commands' });
import { Head, Link, router } from '@inertiajs/react';
import { FileText, Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductListSkeleton } from '@/components/skeleton-loaders';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { EmptyState } from '@/components/empty-state';

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
        active: boolean;
    }>;
}

interface CommandsProps {
    commands: CommandsData;
}

export default function CommandsIndex({ commands }: CommandsProps) {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; commandId: number | null }>({
        open: false,
        commandId: null,
    });

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

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

    const filteredCommands = commands.data.filter((command) =>
        command.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.client_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (commandId: number) => {
        setDeleteDialog({ open: true, commandId });
    };

    const confirmDelete = () => {
        if (deleteDialog.commandId) {
            router.delete(`/commands/${deleteDialog.commandId}`, {
                onSuccess: () => {
                    toast.success('Commande supprimée avec succès.');
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Commandes - HARIMI" />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <ConfirmationDialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, commandId: null })}
                onConfirm={confirmDelete}
                title="Supprimer la commande"
                description="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
                confirmText="Supprimer"
                variant="destructive"
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                            Commandes
                        </h1>
                        <p className="text-sm text-gray-600">
                            {commands.total} commande{commands.total !== 1 ? 's' : ''} au total
                        </p>
                    </div>
                    <Link href="/commands/create">
                        <Button className="bg-burgundy text-white hover:bg-burgundy-dark font-medium">
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle commande
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par référence, client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border/80 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy bg-white text-sm"
                    />
                </div>

                {/* Commands Table */}
                {isLoading ? (
                    <ProductListSkeleton count={5} />
                ) : filteredCommands.length === 0 ? (
                    <Card className="border-border/80">
                        <CardContent>
                            <EmptyState
                                icon={FileText}
                                title="Aucune commande"
                                description="Aucune commande pour le moment. Les commandes apparaîtront ici dès qu'un client passe commande."
                                actionLabel="Créer une commande"
                                actionHref="/commands/create"
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
                                            Référence
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Client
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Montant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCommands.map((command) => (
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
                                                <Badge
                                                    className={`${getStatusColor(command.status)} border font-medium text-xs`}
                                                >
                                                    {getStatusLabel(command.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {parseFloat(command.total_amount).toLocaleString('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'EUR',
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(command.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/commands/${command.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Voir"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/commands/${command.id}/invoice`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            title="Bon de commande"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(command.id)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Supprimer"
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

                        {/* Pagination */}
                        {commands.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-border/80 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Affichage de {commands.data.length} sur {commands.total} commandes
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

