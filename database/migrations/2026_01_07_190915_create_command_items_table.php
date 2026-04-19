<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('command_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('command_id')
                ->constrained('commands')
                ->cascadeOnDelete();
            $table->string('product_name');
            $table->string('variant')->nullable(); // Size/Color text
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();

            $table->index('command_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('command_items');
    }
};
