/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

const commandsIndex = () => ({ url: '/commands' });
import { Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Commandes',
        href: commandsIndex().url,
    },
    {
        title: 'Créer',
        href: '#',
    },
];

interface ProductVariant {
    id: number;
    size: string | null;
    color: string | null;
    price: string;
    stock: number;
}

interface Product {
    id: number;
    title: string;
    category: { name: string };
    brand: { name: string } | null;
    variants: ProductVariant[];
}

interface CommandFormProps {
    products: Product[];
}

interface CommandItem {
    product_id: number | null;
    product_name: string;
    variant: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export default function CreateCommand({ products }: CommandFormProps) {
    const page = usePage();
    const errors = (page.props as any).errors || {};
    const toast = useToast();
    const [items, setItems] = useState<CommandItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

    const addItem = () => {
        if (!selectedProductId || !selectedVariantId) return;

        const product = products.find((p) => p.id === selectedProductId);
        const variant = product?.variants.find((v) => v.id === selectedVariantId);

        if (!product || !variant) return;

        const variantText = [variant.size, variant.color].filter(Boolean).join(' / ') || 'Standard';
        const unitPrice = parseFloat(variant.price);

        setItems([
            ...items,
            {
                product_id: product.id,
                product_name: product.title,
                variant: variantText,
                quantity: 1,
                unit_price: unitPrice,
                total_price: unitPrice,
            },
        ]);

        setSelectedProductId(null);
        setSelectedVariantId(null);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof CommandItem, value: string | number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
            updated[index].total_price = updated[index].quantity * updated[index].unit_price;
        }
        setItems(updated);
    };

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (items.length === 0) {
            toast.error('Veuillez ajouter au moins un article.');
            return;
        }

        router.post('/commands', {
            client_name: formData.get('client_name') as string,
            client_email: formData.get('client_email') as string,
            status: formData.get('status') as string || 'pending',
            notes: (formData.get('notes') as string) || null,
            items: items.map((item) => ({
                product_name: item.product_name,
                variant: item.variant,
                quantity: item.quantity,
                unit_price: item.unit_price,
            })),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créer une commande - HARIMI" />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                        Nouvelle commande
                    </h1>
                    <p className="text-sm text-gray-600">
                        Créez une nouvelle commande pour un client
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Client Information */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        Informations client
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                                            Nom du client *
                                        </Label>
                                        <Input
                                            id="client_name"
                                            name="client_name"
                                            required
                                            className="border-gray-300"
                                            placeholder="Jean Dupont"
                                        />
                                        <InputError message={errors.client_name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="client_email" className="text-sm font-medium text-gray-700">
                                            Email *
                                        </Label>
                                        <Input
                                            id="client_email"
                                            name="client_email"
                                            type="email"
                                            required
                                            className="border-gray-300"
                                            placeholder="jean.dupont@example.com"
                                        />
                                        <InputError message={errors.client_email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                                            Statut
                                        </Label>
                                        <select
                                            id="status"
                                            name="status"
                                            defaultValue="pending"
                                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                        >
                                            <option value="pending">En attente</option>
                                            <option value="confirmed">Confirmée</option>
                                            <option value="shipped">Expédiée</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                                            Notes (optionnel)
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            className="border-gray-300"
                                            placeholder="Notes additionnelles..."
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Add Product */}
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        Ajouter un produit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Produit
                                            </Label>
                                            <select
                                                value={selectedProductId || ''}
                                                onChange={(e) => {
                                                    setSelectedProductId(e.target.value ? parseInt(e.target.value) : null);
                                                    setSelectedVariantId(null);
                                                }}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                            >
                                                <option value="">Sélectionner un produit</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Variante
                                            </Label>
                                            <select
                                                value={selectedVariantId || ''}
                                                onChange={(e) => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : null)}
                                                disabled={!selectedProduct}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy disabled:bg-gray-50 disabled:text-gray-500"
                                            >
                                                <option value="">Sélectionner une variante</option>
                                                {selectedProduct?.variants.map((variant) => {
                                                    const variantText = [variant.size, variant.color].filter(Boolean).join(' / ') || 'Standard';
                                                    return (
                                                        <option key={variant.id} value={variant.id}>
                                                            {variantText} - {parseFloat(variant.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (Stock: {variant.stock})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={addItem}
                                        disabled={!selectedProductId || !selectedVariantId}
                                        className="bg-burgundy text-white hover:bg-burgundy-dark"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Ajouter au panier
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="border-border/80 sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        Résumé de la commande
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">
                                            Aucun article ajouté
                                        </p>
                                    ) : (
                                        <>
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                {items.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="p-3 bg-gray-50 rounded-lg border border-border/80"
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                                    {item.product_name}
                                                                </p>
                                                                {item.variant && (
                                                                    <p className="text-xs text-gray-500">
                                                                        {item.variant}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(index)}
                                                                className="ml-2 text-red-600 hover:text-red-700"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Qté</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                                    className="h-8 text-sm border-gray-300"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Prix unit.</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={item.unit_price}
                                                                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                    className="h-8 text-sm border-gray-300"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Total</Label>
                                                                <div className="h-8 flex items-center text-sm font-medium text-gray-900">
                                                                    {item.total_price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-border/80">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-base font-semibold text-gray-900">
                                                        Total
                                                    </span>
                                                    <span className="text-xl font-bold text-burgundy">
                                                        {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={items.length === 0}
                            className="bg-burgundy text-white hover:bg-burgundy-dark font-medium"
                        >
                            Créer la commande
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(commandsIndex().url)}
                            className="border-gray-300"
                        >
                            Annuler
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

