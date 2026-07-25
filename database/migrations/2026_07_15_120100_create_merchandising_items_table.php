<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchandising_items', function (Blueprint $table) {
            $table->id();
            $table->string('shelf', 32);
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['shelf', 'product_id']);
            $table->index(['shelf', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchandising_items');
    }
};
