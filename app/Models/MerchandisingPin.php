<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchandisingPin extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'section_id',
        'product_id',
        'position',
        'mode',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(MerchandisingSection::class, 'section_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function isInclude(): bool
    {
        return $this->mode === 'include';
    }

    public function isExclude(): bool
    {
        return $this->mode === 'exclude';
    }
}
