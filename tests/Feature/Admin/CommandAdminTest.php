<?php

namespace Tests\Feature\Admin;

use App\Enums\PaymentStatus;
use App\Models\Command;
use App\Models\CommandItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommandAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_list_and_filter_storefront_orders(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $pending = $this->makeStorefrontOrder(
            reference: 'CMD-2026-0001',
            paymentStatus: PaymentStatus::PendingPayment,
            status: 'pending',
        );
        $paid = $this->makeStorefrontOrder(
            reference: 'CMD-2026-0002',
            paymentStatus: PaymentStatus::Paid,
            status: 'confirmed',
            email: 'paid@example.com',
        );

        $this->actingAs($staff)
            ->get(route('commands.index', ['payment_status' => PaymentStatus::Paid->value]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('commands/index')
                ->has('commands.data', 1)
                ->where('commands.data.0.reference', $paid->reference)
                ->where('commands.data.0.payment_status', PaymentStatus::Paid->value)
                ->where('filters.payment_status', PaymentStatus::Paid->value)
            );

        $this->actingAs($staff)
            ->get(route('commands.index', ['q' => 'pending-guest@example.com']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('commands.data', 1)
                ->where('commands.data.0.id', $pending->id)
            );
    }

    public function test_cannot_ship_unpaid_storefront_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makeStorefrontOrder(
            paymentStatus: PaymentStatus::PendingPayment,
            status: 'pending',
        );

        $this->actingAs($staff)
            ->from(route('commands.show', $order))
            ->put(route('commands.update', $order), $this->updatePayload($order, 'shipped'))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame('pending', $order->fresh()->status);
        $this->assertNull($order->fresh()->shipped_at);
    }

    public function test_can_ship_paid_storefront_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makeStorefrontOrder(
            paymentStatus: PaymentStatus::Paid,
            status: 'confirmed',
        );

        $this->actingAs($staff)
            ->put(route('commands.update', $order), $this->updatePayload($order, 'shipped'))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasNoErrors();

        $fresh = $order->fresh();
        $this->assertSame('shipped', $fresh->status);
        $this->assertNotNull($fresh->shipped_at);
    }

    public function test_can_cancel_pending_payment_storefront_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makeStorefrontOrder(
            paymentStatus: PaymentStatus::PendingPayment,
            status: 'pending',
        );

        $this->actingAs($staff)
            ->put(route('commands.update', $order), $this->updatePayload($order, 'cancelled'))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasNoErrors();

        $fresh = $order->fresh();
        $this->assertSame('cancelled', $fresh->status);
        $this->assertNotNull($fresh->cancelled_at);
    }

    public function test_cannot_mutate_storefront_line_items(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makeStorefrontOrder(
            paymentStatus: PaymentStatus::Paid,
            status: 'confirmed',
        );

        $payload = $this->updatePayload($order, 'confirmed');
        $payload['items'] = [
            [
                'product_name' => 'Hacked',
                'variant' => null,
                'quantity' => 9,
                'unit_price' => 1,
            ],
        ];

        $this->actingAs($staff)
            ->from(route('commands.show', $order))
            ->put(route('commands.update', $order), $payload)
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasErrors('items');

        $this->assertSame(1, $order->items()->count());
        $this->assertNotSame('Hacked', $order->items()->first()->product_name);
    }

    public function test_cannot_reactivate_cancelled_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makeStorefrontOrder(
            paymentStatus: PaymentStatus::PendingPayment,
            status: 'cancelled',
        );
        $order->update(['cancelled_at' => now()]);

        $this->actingAs($staff)
            ->from(route('commands.show', $order))
            ->put(route('commands.update', $order), $this->updatePayload($order, 'pending'))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasErrors('status');

        $this->assertSame('cancelled', $order->fresh()->status);
    }

    /**
     * @return array<string, mixed>
     */
    private function updatePayload(Command $order, string $status): array
    {
        return [
            'client_name' => $order->client_name,
            'client_email' => $order->client_email,
            'fulfillment_type' => $order->fulfillment_type ?? 'ship',
            'status' => $status,
            'notes' => $order->notes,
        ];
    }

    private function makeStorefrontOrder(
        PaymentStatus $paymentStatus,
        string $status,
        ?string $reference = null,
        string $email = 'pending-guest@example.com',
    ): Command {
        $command = Command::query()->create([
            'reference' => $reference ?? Command::generateReference(),
            'client_name' => 'Anna Rossi',
            'client_email' => $email,
            'client_phone' => '+393331112233',
            'locale' => 'it',
            'currency' => 'EUR',
            'fulfillment_type' => Command::FULFILLMENT_SHIP,
            'billing_same_as_shipping' => true,
            'shipping_line1' => 'Via Roma 1',
            'shipping_city' => 'Milano',
            'shipping_province' => 'MI',
            'shipping_postal_code' => '20121',
            'shipping_country' => 'IT',
            'billing_line1' => 'Via Roma 1',
            'billing_city' => 'Milano',
            'billing_province' => 'MI',
            'billing_postal_code' => '20121',
            'billing_country' => 'IT',
            'status' => $status,
            'payment_status' => $paymentStatus->value,
            'subtotal_amount' => 20,
            'shipping_amount' => 5.90,
            'tax_amount' => 0,
            'total_amount' => 25.90,
            'source' => 'storefront',
            'paid_at' => $paymentStatus === PaymentStatus::Paid ? now() : null,
            'confirmed_at' => $status === 'confirmed' || $paymentStatus === PaymentStatus::Paid ? now() : null,
        ]);

        CommandItem::query()->create([
            'command_id' => $command->id,
            'product_name' => 'Reggiseno Test',
            'variant' => 'Nero / 3B',
            'size' => '3B',
            'color' => 'Nero',
            'quantity' => 1,
            'unit_price' => 20,
            'total_price' => 20,
        ]);

        return $command->load('items');
    }
}
