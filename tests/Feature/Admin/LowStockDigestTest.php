<?php

namespace Tests\Feature\Admin;

use App\Mail\LowStockDigestMail;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Support\UniqueSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LowStockDigestTest extends TestCase
{
    use RefreshDatabase;

    public function test_sends_digest_to_staff_when_alerts_exist(): void
    {
        Mail::fake();
        config(['harimi.inventory.low_stock_threshold' => 5]);

        User::factory()->create(['role' => 'staff', 'email' => 'staff@harimi.test']);
        User::factory()->create(['role' => 'client', 'email' => 'client@harimi.test']);

        $this->makeVariant(0);
        $this->makeVariant(2);
        $this->makeVariant(20);

        $this->artisan('harimi:send-low-stock-digest')
            ->expectsOutputToContain('Sent low-stock digest to 1 recipient(s) (1 out, 1 low).')
            ->expectsOutputToContain('staff@harimi.test')
            ->assertSuccessful();

        Mail::assertSent(LowStockDigestMail::class, function (LowStockDigestMail $mail) {
            return $mail->hasTo('staff@harimi.test')
                && $mail->outCount === 1
                && $mail->lowCount === 1
                && count($mail->rows) === 2;
        });

        Mail::assertNotSent(LowStockDigestMail::class, fn (LowStockDigestMail $mail) => $mail->hasTo('client@harimi.test'));
    }

    public function test_dry_run_does_not_send(): void
    {
        Mail::fake();
        config(['harimi.inventory.low_stock_threshold' => 5]);

        User::factory()->create(['role' => 'staff', 'email' => 'staff@harimi.test']);
        $this->makeVariant(0);

        $this->artisan('harimi:send-low-stock-digest', ['--dry-run' => true])
            ->expectsOutputToContain('Would send low-stock digest to 1 recipient(s)')
            ->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_skips_when_no_alerts(): void
    {
        Mail::fake();
        config(['harimi.inventory.low_stock_threshold' => 5]);

        User::factory()->create(['role' => 'staff', 'email' => 'staff@harimi.test']);
        $this->makeVariant(20);

        $this->artisan('harimi:send-low-stock-digest')
            ->expectsOutputToContain('No low-stock variants')
            ->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_uses_configured_recipients_override(): void
    {
        Mail::fake();
        config([
            'harimi.inventory.low_stock_threshold' => 5,
            'harimi.inventory.digest_recipients' => 'ops@harimi.test, buyer@harimi.test',
        ]);

        User::factory()->create(['role' => 'staff', 'email' => 'staff@harimi.test']);
        $this->makeVariant(1);

        $this->artisan('harimi:send-low-stock-digest')
            ->expectsOutputToContain('Sent low-stock digest to 2 recipient(s)')
            ->assertSuccessful();

        Mail::assertSent(LowStockDigestMail::class, 2);
        Mail::assertSent(LowStockDigestMail::class, fn (LowStockDigestMail $mail) => $mail->hasTo('ops@harimi.test'));
        Mail::assertSent(LowStockDigestMail::class, fn (LowStockDigestMail $mail) => $mail->hasTo('buyer@harimi.test'));
    }

    public function test_disabled_unless_forced(): void
    {
        Mail::fake();
        config([
            'harimi.inventory.low_stock_threshold' => 5,
            'harimi.inventory.digest_enabled' => false,
        ]);

        User::factory()->create(['role' => 'staff', 'email' => 'staff@harimi.test']);
        $this->makeVariant(0);

        $this->artisan('harimi:send-low-stock-digest')
            ->expectsOutputToContain('Low-stock digest is disabled')
            ->assertSuccessful();

        Mail::assertNothingSent();

        $this->artisan('harimi:send-low-stock-digest', ['--force' => true])
            ->expectsOutputToContain('Sent low-stock digest to 1 recipient(s)')
            ->assertSuccessful();

        Mail::assertSent(LowStockDigestMail::class, 1);
    }

    private function makeVariant(int $stock): ProductVariant
    {
        static $n = 0;
        $n++;

        $category = Category::create(['parent_id' => null]);
        foreach (['it', 'en'] as $loc) {
            $category->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('cat-digest-'.$n, 'category_translations', $loc),
                'name' => 'Cat',
            ]);
        }

        $brand = Brand::create(['logo' => null]);
        foreach (['it', 'en'] as $loc) {
            $brand->translations()->create([
                'locale' => $loc,
                'slug' => UniqueSlug::make('brand-digest-'.$n, 'brand_translations', $loc),
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
                'slug' => UniqueSlug::make('product-digest-'.$n, 'product_translations', $loc),
                'title' => 'Product '.$n,
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
