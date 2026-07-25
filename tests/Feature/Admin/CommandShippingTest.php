<?php

namespace Tests\Feature\Admin;

use App\Enums\PaymentStatus;
use App\Mail\OrderShippedMail;
use App\Models\Command;
use App\Models\CommandItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommandShippingTest extends TestCase
{
    use RefreshDatabase;

    public function test_shipping_saves_tracking_and_emails_once(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makePaidOrder();

        $this->actingAs($staff)
            ->put(route('commands.update', $order), [
                'client_name' => $order->client_name,
                'client_email' => $order->client_email,
                'fulfillment_type' => 'ship',
                'status' => 'shipped',
                'notes' => null,
                'shipping_carrier' => 'BRT',
                'tracking_number' => 'BRT123456',
                'tracking_url' => 'https://www.brt.it/track?c=BRT123456',
            ])
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertSame('shipped', $order->status);
        $this->assertSame('BRT', $order->shipping_carrier);
        $this->assertSame('BRT123456', $order->tracking_number);
        $this->assertNotNull($order->shipped_at);
        Mail::assertSent(OrderShippedMail::class, 1);

        // Updating tracking while already shipped must not resend the email.
        $this->actingAs($staff)
            ->put(route('commands.update', $order), [
                'client_name' => $order->client_name,
                'client_email' => $order->client_email,
                'fulfillment_type' => 'ship',
                'status' => 'shipped',
                'notes' => null,
                'shipping_carrier' => 'BRT',
                'tracking_number' => 'BRT999',
                'tracking_url' => 'https://www.brt.it/track?c=BRT999',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame('BRT999', $order->fresh()->tracking_number);
        Mail::assertSent(OrderShippedMail::class, 1);
    }

    public function test_cannot_ship_unpaid_storefront_order_even_with_tracking(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);
        $order = $this->makePaidOrder();
        $order->update([
            'payment_status' => PaymentStatus::PendingPayment,
            'paid_at' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($staff)
            ->from(route('commands.show', $order))
            ->put(route('commands.update', $order), [
                'client_name' => $order->client_name,
                'client_email' => $order->client_email,
                'fulfillment_type' => 'ship',
                'status' => 'shipped',
                'tracking_number' => 'X',
            ])
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasErrors('status');

        Mail::assertNothingSent();
    }

    private function makePaidOrder(): Command
    {
        $command = Command::query()->create([
            'reference' => Command::generateReference(),
            'client_name' => 'Anna Rossi',
            'client_email' => 'anna-ship@example.com',
            'client_phone' => '+393331112233',
            'locale' => 'it',
            'currency' => 'EUR',
            'fulfillment_type' => Command::FULFILLMENT_SHIP,
            'status' => 'confirmed',
            'payment_status' => PaymentStatus::Paid->value,
            'shipping_line1' => 'Via Roma 1',
            'shipping_city' => 'Milano',
            'shipping_province' => 'MI',
            'shipping_postal_code' => '20121',
            'shipping_country' => 'IT',
            'subtotal_amount' => 20,
            'shipping_amount' => 5.90,
            'tax_amount' => 0,
            'total_amount' => 25.90,
            'source' => 'storefront',
            'paid_at' => now(),
            'confirmed_at' => now(),
        ]);

        CommandItem::query()->create([
            'command_id' => $command->id,
            'product_name' => 'Reggiseno Test',
            'quantity' => 1,
            'unit_price' => 20,
            'total_price' => 20,
        ]);

        return $command;
    }
}
