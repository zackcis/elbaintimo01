<?php

namespace App\Models;

use App\Enums\MerchandisingShelf;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchandisingSection extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'title_it',
        'title_en',
        'audience',
        'max_items',
        'rules',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'max_items' => 'integer',
            'rules' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function pins(): HasMany
    {
        return $this->hasMany(MerchandisingPin::class, 'section_id');
    }

    public function titleForLocale(string $locale): string
    {
        return $locale === 'en'
            ? (string) $this->title_en
            : (string) $this->title_it;
    }

    /**
     * @return list<string>
     */
    public static function knownSlugs(): array
    {
        return MerchandisingShelf::values();
    }
}
