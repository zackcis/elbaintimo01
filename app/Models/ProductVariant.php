<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'size',
        'color',
        'color_it',
        'color_en',
        'color_hex',
        'price',
        'compare_at_price',
        'stock',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
        ];
    }

    public function colorForLocale(string $locale): ?string
    {
        $preferred = $locale === 'en' ? $this->color_en : $this->color_it;
        if (filled($preferred)) {
            return (string) $preferred;
        }

        if (filled($this->color_it)) {
            return (string) $this->color_it;
        }

        if (filled($this->color_en)) {
            return (string) $this->color_en;
        }

        return filled($this->color) ? (string) $this->color : null;
    }

    /**
     * Get the product that owns the variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
