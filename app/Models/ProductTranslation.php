<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductTranslation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'locale',
        'slug',
        'title',
        'description',
        'care_notes',
        'fit_notes',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
