<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Http\Requests\StoreCommandRequest;
use App\Http\Requests\UpdateCommandRequest;
use App\Mail\OrderShippedMail;
use App\Models\Command;
use App\Models\CommandItem;
use App\Models\Product;
use App\Models\User;
use App\Services\Checkout\RefundPaidOrder;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CommandController extends Controller
{
    use LogsActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'payment_status' => $request->query('payment_status'),
            'status' => $request->query('status'),
            'source' => $request->query('source'),
        ];

        $query = Command::query()->with('items')->latest();

        if ($filters['q'] !== '') {
            $q = $filters['q'];
            $query->where(function ($builder) use ($q): void {
                $builder->where('reference', 'like', "%{$q}%")
                    ->orWhere('client_name', 'like', "%{$q}%")
                    ->orWhere('client_email', 'like', "%{$q}%");
            });
        }

        if (is_string($filters['payment_status']) && $filters['payment_status'] !== '') {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (is_string($filters['status']) && $filters['status'] !== '') {
            $query->where('status', $filters['status']);
        }

        if (is_string($filters['source']) && $filters['source'] !== '') {
            $query->where('source', $filters['source']);
        }

        $commands = $query->paginate(15)->withQueryString();

        return Inertia::render('commands/index', [
            'commands' => $commands,
            'filters' => [
                'q' => $filters['q'],
                'payment_status' => is_string($filters['payment_status']) ? $filters['payment_status'] : '',
                'status' => is_string($filters['status']) ? $filters['status'] : '',
                'source' => is_string($filters['source']) ? $filters['source'] : '',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $products = Product::query()
            ->with(['variants', 'category.translations', 'brand.translations', 'translations'])
            ->adminOrderByTitle()
            ->get();

        $clients = User::query()
            ->where('role', 'client')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'phone']);

        return Inertia::render('commands/create', [
            'products' => $products,
            'clients' => $clients,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCommandRequest $request): RedirectResponse
    {
        if ($request->input('client_mode') === 'existing') {
            $client = User::query()
                ->whereKey((int) $request->input('client_user_id'))
                ->where('role', 'client')
                ->firstOrFail();
            $clientName = $client->name;
            $clientEmail = $client->email;
        } else {
            User::query()->create([
                'name' => $request->input('new_client_name'),
                'email' => $request->input('new_client_email'),
                'password' => Hash::make(Str::password(24)),
                'phone' => $request->input('new_client_phone'),
                'address' => $request->input('new_client_address'),
                'role' => 'client',
            ]);
            $clientName = (string) $request->input('new_client_name');
            $clientEmail = (string) $request->input('new_client_email');
        }

        $command = Command::create([
            'reference' => Command::generateReference(),
            'client_name' => $clientName,
            'client_email' => $clientEmail,
            'fulfillment_type' => $request->input('fulfillment_type', Command::FULFILLMENT_PICKUP),
            'status' => $request->status ?? 'pending',
            'payment_status' => PaymentStatus::NotApplicable->value,
            'total_amount' => 0,
            'notes' => $request->notes,
            'source' => 'admin',
        ]);

        $totalAmount = 0;

        foreach ($request->items as $itemData) {
            $item = CommandItem::create([
                'command_id' => $command->id,
                'product_name' => $itemData['product_name'],
                'variant' => $itemData['variant'] ?? null,
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'total_price' => $itemData['quantity'] * $itemData['unit_price'],
            ]);

            $totalAmount += $item->total_price;
        }

        $command->update(['total_amount' => $totalAmount]);

        return redirect()->route('commands.show', $command)
            ->with('success', 'Commande créée avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $locale, Command $command): Response
    {
        $command->load(['items', 'client']);

        return Inertia::render('commands/show', [
            'command' => $command,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $locale, Command $command): Response
    {
        $command->load('items');
        $products = Product::query()
            ->with(['variants', 'category.translations', 'brand.translations', 'translations'])
            ->adminOrderByTitle()
            ->get();

        return Inertia::render('commands/edit', [
            'command' => $command,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCommandRequest $request, string $locale, Command $command): RedirectResponse
    {
        $oldStatus = $command->status;
        $isStorefront = $command->source === 'storefront';

        $payload = [
            'status' => $request->status,
            'notes' => $request->notes,
            'shipping_carrier' => $request->input('shipping_carrier'),
            'tracking_number' => $request->input('tracking_number'),
            'tracking_url' => $request->input('tracking_url'),
        ];

        if (! $isStorefront) {
            $payload['client_name'] = $request->client_name;
            $payload['client_email'] = $request->client_email;
            $payload['fulfillment_type'] = $request->input('fulfillment_type', Command::FULFILLMENT_PICKUP);
        }

        $command->update($payload);

        $justShipped = $request->status === 'shipped' && $oldStatus !== 'shipped';

        if ($request->status === 'confirmed' && $oldStatus !== 'confirmed') {
            $command->update(['confirmed_at' => now()]);
        }
        if ($justShipped) {
            $command->update(['shipped_at' => now()]);
        }
        if ($request->status === 'cancelled' && $oldStatus !== 'cancelled') {
            $command->update(['cancelled_at' => now()]);
        }

        if ($oldStatus !== $request->status) {
            $statusLabels = [
                'pending' => 'En attente',
                'confirmed' => 'Confirmée',
                'shipped' => 'Expédiée',
                'cancelled' => 'Annulée',
            ];
            $this->logActivity(
                'status_updated',
                'Command',
                $command->id,
                "Statut de la commande {$command->reference} changé de '{$statusLabels[$oldStatus]}' à '{$statusLabels[$request->status]}'"
            );
        }

        if (! $isStorefront && $request->has('items')) {
            $command->items()->delete();
            $totalAmount = 0;

            foreach ($request->items as $itemData) {
                $item = CommandItem::create([
                    'command_id' => $command->id,
                    'product_name' => $itemData['product_name'],
                    'variant' => $itemData['variant'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'total_price' => $itemData['quantity'] * $itemData['unit_price'],
                ]);

                $totalAmount += $item->total_price;
            }

            $command->update(['total_amount' => $totalAmount]);
        }

        if ($justShipped && $command->client_email) {
            Mail::to($command->client_email)->send(new OrderShippedMail($command->fresh('items')));
        }

        return redirect()->route('commands.show', $command)
            ->with('success', 'Commande mise à jour avec succès.');
    }

    /**
     * Full Stripe refund for a paid storefront order.
     */
    public function refund(string $locale, Command $command, RefundPaidOrder $refund): RedirectResponse
    {
        try {
            $refund->handle($command);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return redirect()
                ->route('commands.show', $command)
                ->with('error', 'Refund failed: '.$e->getMessage());
        }

        $this->logActivity(
            'refunded',
            'Command',
            $command->id,
            "Ordine {$command->reference} rimborsato"
        );

        return redirect()
            ->route('commands.show', $command)
            ->with('success', 'Order refunded successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $locale, Command $command): RedirectResponse
    {
        $command->delete();

        return redirect()->route('commands.index')
            ->with('success', 'Commande supprimée avec succès.');
    }

    /**
     * Generate and display Bon de Commande (Invoice)
     */
    public function invoice(string $locale, Command $command): Response
    {
        $command->load('items');

        return Inertia::render('commands/invoice', [
            'command' => $command,
        ]);
    }
}
