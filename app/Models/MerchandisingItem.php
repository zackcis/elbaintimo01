<?php

namespace App\Models;

use App\Enums\MerchandisingShelf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchandisingItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'shelf',
        'product_id',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'shelf' => MerchandisingShelf::class,
            'position' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
