<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommandItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'command_id',
        'product_name',
        'variant',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    /**
     * Get the command that owns the item.
     */
    public function command(): BelongsTo
    {
        return $this->belongsTo(Command::class);
    }
}
