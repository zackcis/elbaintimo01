<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommandRequest;
use App\Http\Requests\UpdateCommandRequest;
use App\Models\Command;
use App\Models\CommandItem;
use App\Models\Product;
use App\Models\User;
use App\Traits\LogsActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CommandController extends Controller
{
    use LogsActivity;

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $commands = Command::with('items')
            ->latest()
            ->paginate(15);

        return Inertia::render('commands/index', [
            'commands' => $commands,
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
            'total_amount' => 0, // Will be calculated
            'notes' => $request->notes,
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
        $command->load('items');

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

        $command->update([
            'client_name' => $request->client_name,
            'client_email' => $request->client_email,
            'fulfillment_type' => $request->input('fulfillment_type', Command::FULFILLMENT_PICKUP),
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        // Update timestamps based on status
        if ($request->status === 'confirmed' && $oldStatus !== 'confirmed') {
            $command->update(['confirmed_at' => now()]);
        }
        if ($request->status === 'shipped' && $oldStatus !== 'shipped') {
            $command->update(['shipped_at' => now()]);
        }
        if ($request->status === 'cancelled' && $oldStatus !== 'cancelled') {
            $command->update(['cancelled_at' => now()]);
        }

        // Log status change
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

        // Update items if provided
        if ($request->has('items')) {
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

        return redirect()->route('commands.show', $command)
            ->with('success', 'Commande mise à jour avec succès.');
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
