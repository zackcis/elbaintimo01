<?php

namespace Tests\Feature\Api\V1;

use App\Enums\PaymentStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Command;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmationMail;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
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

    public function test_preview_returns_totals_and_stock_ok(): void
    {
        $variant = $this->makeVariant(stock: 5, price: 39.90);

        $this->postJson('/api/v1/checkout/preview?locale=it', [
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 2],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.subtotal', '79.80')
            ->assertJsonPath('data.currency', 'EUR');
    }

    public function test_preview_rejects_insufficient_stock(): void
    {
        $variant = $this->makeVariant(stock: 1, price: 10);

        $this->postJson('/api/v1/checkout/preview?locale=it', [
            'items' => [
                ['variant_id' => $variant->id, 'quantity' => 3],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonPath('data.available', false);
    }

    public function test_guest_can_place_pending_payment_order_with_stripe_checkout_url(): void
    {
        $variant = $this->makeVariant(stock: 4, price: 20);

        $response = $this->postJson('/api/v1/checkout/orders?locale=it', $this->orderPayload($variant->id, 'test-key-1'));

        $response
            ->assertCreated()
            ->assertJsonPath('data.payment_status', PaymentStatus::PendingPayment->value)
            ->assertJsonPath('data.fulfillment_type', 'ship')
            ->assertJsonPath('data.customer.email', 'anna@example.com')
            ->assertJsonPath('data.payment.mode', 'stripe_checkout')
            ->assertJsonPath('data.payment.checkout_url', 'https://checkout.stripe.com/c/pay/cs_test_harimi_fake');

        $this->assertNotEmpty($response->json('data.payment.checkout_session_id'));

        $reference = $response->json('data.reference');
        $token = $response->json('data.confirmation_token');

        $this->assertNotEmpty($reference);
        $this->assertNotEmpty($token);

        // Stock not decremented until paid.
        $this->assertSame(4, (int) $variant->fresh()->stock);

        $this->getJson('/api/v1/checkout/orders/'.$reference.'?token='.$token)
            ->assertOk()
            ->assertJsonPath('data.reference', $reference)
            ->assertJsonPath('data.shipment.carrier', null)
            ->assertJsonPath('data.shipment.tracking_number', null)
            ->assertJsonStructure([
                'data' => [
                    'shipment' => ['carrier', 'tracking_number', 'tracking_url'],
                    'shipped_at',
                ],
            ]);

        $this->getJson('/api/v1/checkout/orders/'.$reference.'?token=wrong')
            ->assertNotFound();

        // Idempotent replay returns the same order (with a fresh checkout session).
        $again = $this->postJson('/api/v1/checkout/orders?locale=it', $this->orderPayload($variant->id, 'test-key-1'))
            ->assertCreated();

        $this->assertSame($reference, $again->json('data.reference'));
        $this->assertSame(1, Command::query()->where('source', 'storefront')->count());
        $this->assertNotEmpty($again->json('data.payment.checkout_url'));
    }

    public function test_stripe_webhook_marks_paid_decrements_stock_and_upserts_client(): void
    {
        Mail::fake();

        $variant = $this->makeVariant(stock: 4, price: 20);

        $created = $this->postJson('/api/v1/checkout/orders?locale=it', $this->orderPayload($variant->id, 'pay-key-1'))
            ->assertCreated();

        $reference = $created->json('data.reference');
        $sessionId = $created->json('data.payment.checkout_session_id');

        $payload = json_encode([
            'id' => 'evt_test_1',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => $sessionId,
                    'client_reference_id' => $reference,
                    'payment_intent' => 'pi_test_123',
                    'metadata' => [
                        'order_reference' => $reference,
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

        $order = Command::query()->where('reference', $reference)->firstOrFail();
        $this->assertSame(PaymentStatus::Paid, $order->payment_status);
        $this->assertSame('confirmed', $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertSame(3, (int) $variant->fresh()->stock);

        $client = User::query()->where('email', 'anna@example.com')->first();
        $this->assertNotNull($client);
        $this->assertSame('client', $client->role);
        $this->assertSame($client->id, $order->client_id);

        Mail::assertSent(OrderConfirmationMail::class);

        // Idempotent webhook replay.
        $this->call(
            'POST',
            '/api/v1/webhooks/stripe',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_STRIPE_SIGNATURE' => 't=1,v1=fake'],
            $payload,
        )->assertOk();

        $this->assertSame(3, (int) $variant->fresh()->stock);
        $this->assertSame(1, User::query()->where('email', 'anna@example.com')->count());
        Mail::assertSent(OrderConfirmationMail::class, 1);
    }

    public function test_order_show_includes_shipment_tracking_when_shipped(): void
    {
        $variant = $this->makeVariant(stock: 3, price: 20);

        $created = $this->postJson('/api/v1/checkout/orders?locale=it', $this->orderPayload($variant->id, 'ship-key-1'))
            ->assertCreated();

        $reference = $created->json('data.reference');
        $token = $created->json('data.confirmation_token');

        $order = Command::query()->where('reference', $reference)->firstOrFail();
        $order->forceFill([
            'payment_status' => PaymentStatus::Paid,
            'status' => 'shipped',
            'paid_at' => now(),
            'shipped_at' => now(),
            'shipping_carrier' => 'BRT',
            'tracking_number' => 'BRT42',
            'tracking_url' => 'https://example.com/track/BRT42',
        ])->save();

        $this->getJson('/api/v1/checkout/orders/'.$reference.'?token='.$token)
            ->assertOk()
            ->assertJsonPath('data.status', 'shipped')
            ->assertJsonPath('data.shipment.carrier', 'BRT')
            ->assertJsonPath('data.shipment.tracking_number', 'BRT42')
            ->assertJsonPath('data.shipment.tracking_url', 'https://example.com/track/BRT42')
            ->assertJsonPath('data.payment.mode', 'paid');
    }

    public function test_cannot_order_unpublished_product(): void
    {
        $variant = $this->makeVariant(stock: 5, price: 10, published: false);

        $this->postJson('/api/v1/checkout/orders?locale=it', $this->orderPayload($variant->id))
            ->assertStatus(422);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(int $variantId, ?string $idempotencyKey = null): array
    {
        return [
            'customer' => [
                'name' => 'Anna Rossi',
                'email' => 'anna@example.com',
                'phone' => '+393331112233',
            ],
            'shipping_address' => [
                'line1' => 'Via Roma 1',
                'line2' => null,
                'city' => 'Milano',
                'province' => 'MI',
                'postal_code' => '20121',
                'country' => 'IT',
            ],
            'billing_same_as_shipping' => true,
            'items' => [
                ['variant_id' => $variantId, 'quantity' => 1],
            ],
            'idempotency_key' => $idempotencyKey,
            'success_url' => 'http://localhost:3000/it/checkout/confirmation?reference={ORDER_REFERENCE}&token={CONFIRMATION_TOKEN}',
            'cancel_url' => 'http://localhost:3000/it/checkout?cancelled=1',
        ];
    }

    private function makeVariant(int $stock, float $price, bool $published = true): ProductVariant
    {
        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-checkout', 'category_translations', $loc),
                'name' => 'Cat',
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-checkout', 'brand_translations', $loc),
                'name' => 'Brand',
            ]);
        }

        $product = Product::create([
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'is_published' => $published,
            'published_at' => $published ? now() : null,
        ]);

        foreach (['it', 'en'] as $loc) {
            $product->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('product-checkout-'.$published, 'product_translations', $loc),
                'title' => 'Reggiseno Test',
                'description' => null,
            ]);
        }

        return ProductVariant::create([
            'product_id' => $product->id,
            'size' => '3B',
            'color' => 'Nero',
            'color_hex' => '#000000',
            'price' => $price,
            'stock' => $stock,
        ]);
    }
}
