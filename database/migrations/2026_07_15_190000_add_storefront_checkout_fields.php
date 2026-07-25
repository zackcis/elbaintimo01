<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commands', function (Blueprint $table) {
            $table->foreignId('client_id')
                ->nullable()
                ->after('id')
                ->constrained('users')
                ->nullOnDelete();
            $table->string('client_phone', 50)->nullable()->after('client_email');
            $table->string('locale', 8)->nullable()->after('client_phone');
            $table->string('currency', 3)->default('EUR')->after('locale');
            $table->string('payment_status', 32)->default('not_applicable')->after('status');
            $table->string('confirmation_token', 64)->nullable()->unique()->after('payment_status');
            $table->boolean('billing_same_as_shipping')->default(true)->after('fulfillment_type');
            $table->string('shipping_line1')->nullable()->after('billing_same_as_shipping');
            $table->string('shipping_line2')->nullable()->after('shipping_line1');
            $table->string('shipping_city')->nullable()->after('shipping_line2');
            $table->string('shipping_province', 16)->nullable()->after('shipping_city');
            $table->string('shipping_postal_code', 32)->nullable()->after('shipping_province');
            $table->string('shipping_country', 2)->nullable()->after('shipping_postal_code');
            $table->string('billing_line1')->nullable()->after('shipping_country');
            $table->string('billing_line2')->nullable()->after('billing_line1');
            $table->string('billing_city')->nullable()->after('billing_line2');
            $table->string('billing_province', 16)->nullable()->after('billing_city');
            $table->string('billing_postal_code', 32)->nullable()->after('billing_province');
            $table->string('billing_country', 2)->nullable()->after('billing_postal_code');
            $table->decimal('subtotal_amount', 10, 2)->nullable()->after('total_amount');
            $table->decimal('shipping_amount', 10, 2)->default(0)->after('subtotal_amount');
            $table->decimal('tax_amount', 10, 2)->default(0)->after('shipping_amount');
            $table->string('source', 32)->default('admin')->after('tax_amount');
            $table->string('idempotency_key', 64)->nullable()->unique()->after('source');

            $table->index('payment_status');
            $table->index('client_email');
        });

        Schema::table('command_items', function (Blueprint $table) {
            $table->foreignId('product_id')
                ->nullable()
                ->after('command_id')
                ->constrained('products')
                ->nullOnDelete();
            $table->foreignId('product_variant_id')
                ->nullable()
                ->after('product_id')
                ->constrained('product_variants')
                ->nullOnDelete();
            $table->string('size')->nullable()->after('variant');
            $table->string('color')->nullable()->after('size');
        });
    }

    public function down(): void
    {
        Schema::table('command_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_variant_id');
            $table->dropConstrainedForeignId('product_id');
            $table->dropColumn(['size', 'color']);
        });

        Schema::table('commands', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
            $table->dropUnique(['confirmation_token']);
            $table->dropUnique(['idempotency_key']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['client_email']);
            $table->dropColumn([
                'client_phone',
                'locale',
                'currency',
                'payment_status',
                'confirmation_token',
                'billing_same_as_shipping',
                'shipping_line1',
                'shipping_line2',
                'shipping_city',
                'shipping_province',
                'shipping_postal_code',
                'shipping_country',
                'billing_line1',
                'billing_line2',
                'billing_city',
                'billing_province',
                'billing_postal_code',
                'billing_country',
                'subtotal_amount',
                'shipping_amount',
                'tax_amount',
                'source',
                'idempotency_key',
            ]);
        });
    }
};
