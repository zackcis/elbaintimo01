<?php

namespace Tests\Feature\Checkout;

use App\Enums\PaymentStatus;
use App\Models\Command;
use App\Models\CommandItem;
use App\Services\Checkout\ExpireAbandonedCheckoutOrders;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ExpireAbandonedCheckoutsTest extends TestCase
{
    use RefreshDatabase;

    public function test_expires_old_pending_payment_storefront_orders(): void
    {
        Carbon::setTestNow('2026-07-16 12:00:00');

        $stale = $this->makeOrder(
            payment: PaymentStatus::PendingPayment,
            status: 'pending',
            createdAt: now()->subHours(25),
            reference: 'CMD-2026-0100',
        );
        $fresh = $this->makeOrder(
            payment: PaymentStatus::PendingPayment,
            status: 'pending',
            createdAt: now()->subHours(2),
            reference: 'CMD-2026-0101',
            email: 'fresh@example.com',
        );
        $paid = $this->makeOrder(
            payment: PaymentStatus::Paid,
            status: 'confirmed',
            createdAt: now()->subHours(48),
            reference: 'CMD-2026-0102',
            email: 'paid@example.com',
        );

        $this->artisan('harimi:expire-abandoned-checkouts')
            ->expectsOutputToContain('Expired 1 order(s).')
            ->expectsOutputToContain('CMD-2026-0100')
            ->assertSuccessful();

        $stale->refresh();
        $this->assertSame('cancelled', $stale->status);
        $this->assertSame(PaymentStatus::Cancelled, $stale->payment_status);
        $this->assertNotNull($stale->cancelled_at);

        $this->assertSame('pending', $fresh->fresh()->status);
        $this->assertSame(PaymentStatus::PendingPayment, $fresh->fresh()->payment_status);
        $this->assertSame('confirmed', $paid->fresh()->status);
        $this->assertSame(PaymentStatus::Paid, $paid->fresh()->payment_status);
    }

    public function test_dry_run_does_not_mutate(): void
    {
        Carbon::setTestNow('2026-07-16 12:00:00');

        $stale = $this->makeOrder(
            payment: PaymentStatus::PendingPayment,
            status: 'pending',
            createdAt: now()->subHours(30),
            reference: 'CMD-2026-0200',
        );

        $this->artisan('harimi:expire-abandoned-checkouts', ['--dry-run' => true])
            ->expectsOutputToContain('Would expire 1 order(s).')
            ->assertSuccessful();

        $stale->refresh();
        $this->assertSame('pending', $stale->status);
        $this->assertSame(PaymentStatus::PendingPayment, $stale->payment_status);
        $this->assertNull($stale->cancelled_at);
    }

    public function test_hours_option_override(): void
    {
        Carbon::setTestNow('2026-07-16 12:00:00');

        $order = $this->makeOrder(
            payment: PaymentStatus::PendingPayment,
            status: 'pending',
            createdAt: now()->subHours(3),
            reference: 'CMD-2026-0300',
        );

        app(ExpireAbandonedCheckoutOrders::class)->handle(2);

        $order->refresh();
        $this->assertSame('cancelled', $order->status);
        $this->assertSame(PaymentStatus::Cancelled, $order->payment_status);
    }

    public function test_is_idempotent(): void
    {
        Carbon::setTestNow('2026-07-16 12:00:00');

        $this->makeOrder(
            payment: PaymentStatus::PendingPayment,
            status: 'pending',
            createdAt: now()->subHours(40),
            reference: 'CMD-2026-0400',
        );

        $this->artisan('harimi:expire-abandoned-checkouts')->assertSuccessful();
        $this->artisan('harimi:expire-abandoned-checkouts')
            ->expectsOutput('No abandoned checkout orders to expire.')
            ->assertSuccessful();
    }

    private function makeOrder(
        PaymentStatus $payment,
        string $status,
        Carbon $createdAt,
        string $reference,
        string $email = 'stale@example.com',
    ): Command {
        $command = Command::query()->create([
            'reference' => $reference,
            'client_name' => 'Anna Rossi',
            'client_email' => $email,
            'client_phone' => '+393331112233',
            'locale' => 'it',
            'currency' => 'EUR',
            'fulfillment_type' => Command::FULFILLMENT_SHIP,
            'status' => $status,
            'payment_status' => $payment->value,
            'subtotal_amount' => 20,
            'shipping_amount' => 5.90,
            'tax_amount' => 0,
            'total_amount' => 25.90,
            'source' => 'storefront',
        ]);

        Command::query()->whereKey($command->id)->update([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        CommandItem::query()->create([
            'command_id' => $command->id,
            'product_name' => 'Reggiseno Test',
            'quantity' => 1,
            'unit_price' => 20,
            'total_price' => 20,
        ]);

        return $command->fresh();
    }
}