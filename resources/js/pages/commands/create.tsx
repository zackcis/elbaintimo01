/* REDESIGN: updated for HARIMI UI refresh — kept props unchanged */
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUi } from '@/hooks/use-ui';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { create as commandsCreate, index as commandsIndex, store as commandsStore } from '@/routes/commands';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

import { Plus, Trash2, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/toast';

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

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string | null;
}

interface CommandFormProps {
    products: Product[];
    clients: Client[];
}

interface CommandItem {
    product_id: number | null;
    product_name: string;
    variant: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export default function CreateCommand({ products, clients }: CommandFormProps) {
    const { t, locale } = useUi();
    const dateLocale = locale === 'it' ? 'it-IT' : 'en-US';
    const page = usePage();
    const errors = (page.props as any).errors || {};
    const toast = useToast();
    const [items, setItems] = useState<CommandItem[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

    const [clientMode, setClientMode] = useState<'existing' | 'new'>(() =>
        clients.length > 0 ? 'existing' : 'new',
    );
    const [existingClientId, setExistingClientId] = useState<number | ''>('');
    const [newClientName, setNewClientName] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [newClientAddress, setNewClientAddress] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb.dashboard'), href: dashboard().url },
        { title: t('commands.title'), href: commandsIndex().url },
        { title: t('breadcrumb.create'), href: '#' },
    ];

    useEffect(() => {
        if (clients.length === 0 && clientMode === 'existing') {
            setClientMode('new');
        }
    }, [clients.length, clientMode]);

    const addItem = () => {
        if (!selectedProductId || !selectedVariantId) return;

        const product = products.find((p) => p.id === selectedProductId);
        const variant = product?.variants.find((v) => v.id === selectedVariantId);

        if (!product || !variant) return;

        const variantText = [variant.size, variant.color].filter(Boolean).join(' / ') || t('commands.form.standard');
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
            toast.error(t('commands.need_item'));
            return;
        }

        if (clientMode === 'existing') {
            if (!existingClientId) {
                toast.error(t('commands.need_client'));
                return;
            }
        } else {
            if (!newClientName.trim() || !newClientEmail.trim()) {
                toast.error(t('commands.need_new_client'));
                return;
            }
        }

        const itemsPayload = items.map((item) => ({
            product_name: item.product_name,
            variant: item.variant,
            quantity: item.quantity,
            unit_price: item.unit_price,
        }));

        const base = {
            client_mode: clientMode,
            fulfillment_type: ((formData.get('fulfillment_type') as string) || 'pickup') as string,
            status: ((formData.get('status') as string) || 'pending') as string,
            notes: ((formData.get('notes') as string) || null) as string | null,
            items: itemsPayload,
        };

        if (clientMode === 'existing') {
            router.post(commandsStore.url(), {
                ...base,
                client_user_id: existingClientId as number,
            });
        } else {
            router.post(commandsStore.url(), {
                ...base,
                new_client_name: newClientName.trim(),
                new_client_email: newClientEmail.trim(),
                new_client_phone: newClientPhone.trim() || null,
                new_client_address: newClientAddress.trim() || null,
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('commands.create')} - HARIMI`} />
            <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
            <div className="flex h-full flex-1 flex-col gap-6 p-8 bg-gray-50">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                        {t('commands.create')}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {t('commands.create_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Client Information */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('commands.show.client_info')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                                            <input
                                                type="radio"
                                                name="client_mode_ui"
                                                checked={clientMode === 'existing'}
                                                onChange={() => setClientMode('existing')}
                                                disabled={clients.length === 0}
                                                className="border-gray-300 text-burgundy focus:ring-burgundy"
                                            />
                                            {t('commands.form.existing_client')}
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-800">
                                            <input
                                                type="radio"
                                                name="client_mode_ui"
                                                checked={clientMode === 'new'}
                                                onChange={() => setClientMode('new')}
                                                className="border-gray-300 text-burgundy focus:ring-burgundy"
                                            />
                                            {t('commands.form.new_client')}
                                        </label>
                                    </div>

                                    {clients.length === 0 && (
                                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                            {t('commands.form.no_clients_hint')}
                                        </p>
                                    )}

                                    {clientMode === 'existing' ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="client_user_id" className="text-sm font-medium text-gray-700">
                                                {t('invoice.client')} *
                                            </Label>
                                            <select
                                                id="client_user_id"
                                                value={existingClientId === '' ? '' : String(existingClientId)}
                                                onChange={(e) =>
                                                    setExistingClientId(
                                                        e.target.value ? parseInt(e.target.value, 10) : '',
                                                    )
                                                }
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
                                            >
                                                <option value="">{t('commands.form.select_client')}</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} — {c.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.client_user_id} />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="new_client_name"
                                                        className="text-sm font-medium text-gray-700"
                                                    >
                                                        {t('commands.show.name')} *
                                                    </Label>
                                                    <Input
                                                        id="new_client_name"
                                                        value={newClientName}
                                                        onChange={(e) => setNewClientName(e.target.value)}
                                                        className="border-gray-300"
                                                        placeholder={t('commands.form.name_placeholder')}
                                                        autoComplete="name"
                                                    />
                                                    <InputError message={errors.new_client_name} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label
                                                        htmlFor="new_client_email"
                                                        className="text-sm font-medium text-gray-700"
                                                    >
                                                        {t('auth.register.email')} *
                                                    </Label>
                                                    <Input
                                                        id="new_client_email"
                                                        type="email"
                                                        value={newClientEmail}
                                                        onChange={(e) => setNewClientEmail(e.target.value)}
                                                        className="border-gray-300"
                                                        placeholder={t('commands.form.email_placeholder')}
                                                        autoComplete="email"
                                                    />
                                                    <InputError message={errors.new_client_email} />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="new_client_phone" className="text-sm font-medium text-gray-700">
                                                    {t('commands.form.phone_optional')}
                                                </Label>
                                                <Input
                                                    id="new_client_phone"
                                                    value={newClientPhone}
                                                    onChange={(e) => setNewClientPhone(e.target.value)}
                                                    className="border-gray-300"
                                                    placeholder={t('commands.form.phone_placeholder')}
                                                    autoComplete="tel"
                                                />
                                                <InputError message={errors.new_client_phone} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="new_client_address" className="text-sm font-medium text-gray-700">
                                                    {t('commands.form.address_optional')}
                                                </Label>
                                                <Textarea
                                                    id="new_client_address"
                                                    value={newClientAddress}
                                                    onChange={(e) => setNewClientAddress(e.target.value)}
                                                    rows={2}
                                                    className="border-gray-300"
                                                    placeholder={t('commands.form.address_placeholder')}
                                                />
                                                <InputError message={errors.new_client_address} />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {t('commands.form.account_hint')}
                                            </p>
                                        </>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="fulfillment_type" className="text-sm font-medium text-gray-700">
                                            {t('invoice.fulfillment_label')}
                                        </Label>
                                        <select
                                            id="fulfillment_type"
                                            name="fulfillment_type"
                                            defaultValue="pickup"
                                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                        >
                                            <option value="pickup">{t('invoice.pickup_detail')}</option>
                                            <option value="ship">{t('invoice.ship_detail')}</option>
                                        </select>
                                        <InputError message={errors.fulfillment_type} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                                            {t('invoice.status')}
                                        </Label>
                                        <select
                                            id="status"
                                            name="status"
                                            defaultValue="pending"
                                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                        >
                                            <option value="pending">{t('commands.status.pending')}</option>
                                            <option value="confirmed">{t('commands.status.confirmed')}</option>
                                            <option value="shipped">{t('commands.status.shipped')}</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                                            {t('commands.form.notes_optional')}
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            className="border-gray-300"
                                            placeholder={t('commands.form.notes_placeholder')}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Add Product */}
                            <Card className="border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('commands.form.add_product')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                {t('invoice.product')}
                                            </Label>
                                            <select
                                                value={selectedProductId || ''}
                                                onChange={(e) => {
                                                    setSelectedProductId(e.target.value ? parseInt(e.target.value) : null);
                                                    setSelectedVariantId(null);
                                                }}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy"
                                            >
                                                <option value="">{t('commands.form.select_product')}</option>
                                                {products.map((product) => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                {t('invoice.variant')}
                                            </Label>
                                            <select
                                                value={selectedVariantId || ''}
                                                onChange={(e) => setSelectedVariantId(e.target.value ? parseInt(e.target.value) : null)}
                                                disabled={!selectedProduct}
                                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy disabled:bg-gray-50 disabled:text-gray-500"
                                            >
                                                <option value="">{t('commands.form.select_variant')}</option>
                                                {selectedProduct?.variants.map((variant) => {
                                                    const variantText = [variant.size, variant.color].filter(Boolean).join(' / ') || t('commands.form.standard');
                                                    return (
                                                        <option key={variant.id} value={variant.id}>
                                                            {variantText} - {parseFloat(variant.price).toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })} ({t('products.show.stock')}: {variant.stock})
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
                                        {t('commands.form.add_to_order')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="border-border/80 sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        {t('commands.show.summary')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {items.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-8">
                                            {t('commands.form.no_items')}
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
                                                                <Label className="text-xs text-gray-600">{t('invoice.qty')}</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                                    className="h-8 text-sm border-gray-300"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600">{t('invoice.unit_price')}</Label>
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
                                                                <Label className="text-xs text-gray-600">{t('invoice.total')}</Label>
                                                                <div className="h-8 flex items-center text-sm font-medium text-gray-900">
                                                                    {item.total_price.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-border/80">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-base font-semibold text-gray-900">
                                                        {t('invoice.total')}
                                                    </span>
                                                    <span className="text-xl font-bold text-burgundy">
                                                        {totalAmount.toLocaleString(dateLocale, { style: 'currency', currency: 'EUR' })}
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
                            {t('commands.create')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(commandsIndex().url)}
                            className="border-gray-300"
                        >
                            {t('common.cancel')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

