<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Command extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'client_name',
        'client_email',
        'status',
        'total_amount',
        'notes',
        'confirmed_at',
        'shipped_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'shipped_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Get the items for the command.
     */
    public function items(): HasMany
    {
        return $this->hasMany(CommandItem::class);
    }

    /**
     * Generate next reference number
     */
    public static function generateReference(): string
    {
        $year = date('Y');
        $lastCommand = self::where('reference', 'like', "CMD-{$year}-%")
            ->orderBy('reference', 'desc')
            ->first();

        if ($lastCommand) {
            $lastNumber = (int) substr($lastCommand->reference, -4);
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('CMD-%s-%04d', $year, $nextNumber);
    }

    /**
     * Get status color
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            'pending' => 'orange',
            'confirmed' => 'blue',
            'shipped' => 'green',
            'cancelled' => 'red',
            default => 'gray',
        };
    }
}
