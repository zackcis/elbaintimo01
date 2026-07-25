<?php

namespace Tests\Feature\Admin;

use App\Enums\PaymentStatus;
use App\Mail\OrderRefundedMail;
use App\Models\Command;
use App\Models\CommandItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Brand;
use App\Models\Category;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommandRefundTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.stripe.secret' => 'sk_test_harimi_fake',
            'services.stripe.webhook_secret' => 'whsec_harimi_fake',
        ]);
    }

    public function test_staff_can_refund_paid_storefront_order_and_restock(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);
        $variant = $this->makeVariant(stock: 2);
        $order = $this->makePaidOrder($variant, quantity: 1);

        $this->assertSame(2, (int) $variant->fresh()->stock);

        // Simulate stock already decremented by payment finalization.
        $variant->update(['stock' => 1]);

        $this->actingAs($staff)
            ->post(route('commands.refund', $order))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertSame(PaymentStatus::Refunded, $order->payment_status);
        $this->assertSame('cancelled', $order->status);
        $this->assertNotNull($order->refunded_at);
        $this->assertNotEmpty($order->stripe_refund_id);
        $this->assertSame(2, (int) $variant->fresh()->stock);

        Mail::assertSent(OrderRefundedMail::class, function (OrderRefundedMail $mail) use ($order) {
            return $mail->order->is($order)
                && $mail->hasTo('anna-refund@example.com');
        });
    }

    public function test_cannot_refund_unpaid_order(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $variant = $this->makeVariant(stock: 5);
        $order = $this->makePaidOrder($variant);
        $order->update([
            'payment_status' => PaymentStatus::PendingPayment,
            'paid_at' => null,
            'status' => 'pending',
        ]);

        $this->actingAs($staff)
            ->from(route('commands.show', $order))
            ->post(route('commands.refund', $order))
            ->assertRedirect(route('commands.show', $order))
            ->assertSessionHasErrors('payment');
    }

    public function test_refund_is_idempotent(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);
        $variant = $this->makeVariant(stock: 1);
        $order = $this->makePaidOrder($variant);
        $variant->update(['stock' => 0]);

        $this->actingAs($staff)->post(route('commands.refund', $order))->assertSessionHasNoErrors();
        $stockAfterFirst = (int) $variant->fresh()->stock;

        $this->actingAs($staff)->post(route('commands.refund', $order))->assertSessionHasNoErrors();

        $this->assertSame($stockAfterFirst, (int) $variant->fresh()->stock);
        $this->assertSame(1, Command::query()->where('payment_status', PaymentStatus::Refunded)->count());
        Mail::assertSent(OrderRefundedMail::class, 1);
    }

    public function test_charge_refunded_webhook_applies_local_refund(): void
    {
        Mail::fake();

        $variant = $this->makeVariant(stock: 0);
        $order = $this->makePaidOrder($variant);
        $order->update(['stripe_payment_intent_id' => 'pi_test_refund_1']);

        $payload = json_encode([
            'id' => 'evt_refund_1',
            'type' => 'charge.refunded',
            'data' => [
                'object' => [
                    'id' => 'ch_test_1',
                    'payment_intent' => 'pi_test_refund_1',
                    'refunds' => [
                        'data' => [
                            ['id' => 're_webhook_1'],
                        ],
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR);

        $this->call(
            'POST',
            '/api/v1/webhooks/stripe',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => 't=1,v1=fake'],
            $payload,
        )->assertOk();

        $order->refresh();
        $this->assertSame(PaymentStatus::Refunded, $order->payment_status);
        $this->assertSame('re_webhook_1', $order->stripe_refund_id);
        $this->assertSame(1, (int) $variant->fresh()->stock);
        Mail::assertSent(OrderRefundedMail::class, 1);
    }

    private function makePaidOrder(ProductVariant $variant, int $quantity = 1): Command
    {
        $command = Command::query()->create([
            'reference' => Command::generateReference(),
            'client_name' => 'Anna Rossi',
            'client_email' => 'anna-refund@example.com',
            'client_phone' => '+393331112233',
            'locale' => 'it',
            'currency' => 'EUR',
            'fulfillment_type' => Command::FULFILLMENT_SHIP,
            'status' => 'confirmed',
            'payment_status' => PaymentStatus::Paid->value,
            'subtotal_amount' => 20,
            'shipping_amount' => 5.90,
            'tax_amount' => 0,
            'total_amount' => 25.90,
            'source' => 'storefront',
            'stripe_payment_intent_id' => 'pi_test_admin_refund',
            'paid_at' => now(),
            'confirmed_at' => now(),
        ]);

        CommandItem::query()->create([
            'command_id' => $command->id,
            'product_id' => $variant->product_id,
            'product_variant_id' => $variant->id,
            'product_name' => 'Reggiseno Test',
            'variant' => 'Nero / 3B',
            'quantity' => $quantity,
            'unit_price' => 20,
            'total_price' => 20 * $quantity,
        ]);

        return $command->load('items');
    }

    private function makeVariant(int $stock): ProductVariant
    {
        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-refund', 'category_translations', $loc),
                'name' => 'Cat',
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-refund', 'brand_translations', $loc),
                'name' => 'Brand',
            ]);
        }

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_published' => true,
            'published_at' => now(),
        ]);

        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('product-refund', 'product_translations', $loc),
                'title' => 'Reggiseno Test',
                'description' => null,
            ]);
        }

        return ProductVariant::create([
            'product_id' => $product->id,
            'size' => '3B',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => 20,
            'stock' => $stock,
        ]);
    }
}
