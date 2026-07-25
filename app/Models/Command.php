<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Command extends Model
{
    use HasFactory;

    public const FULFILLMENT_PICKUP = 'pickup';

    public const FULFILLMENT_SHIP = 'ship';

    protected $fillable = [
        'client_id',
        'reference',
        'client_name',
        'client_email',
        'client_phone',
        'locale',
        'currency',
        'fulfillment_type',
        'billing_same_as_shipping',
        'shipping_line1',
        'shipping_line2',
        'shipping_city',
        'shipping_province',
        'shipping_postal_code',
        'shipping_country',
        'shipping_carrier',
        'tracking_number',
        'tracking_url',
        'billing_line1',
        'billing_line2',
        'billing_city',
        'billing_province',
        'billing_postal_code',
        'billing_country',
        'status',
        'payment_status',
        'confirmation_token',
        'subtotal_amount',
        'shipping_amount',
        'tax_amount',
        'total_amount',
        'notes',
        'source',
        'idempotency_key',
        'stripe_checkout_session_id',
        'stripe_payment_intent_id',
        'stripe_refund_id',
        'paid_at',
        'refunded_at',
        'confirmed_at',
        'shipped_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'billing_same_as_shipping' => 'boolean',
            'subtotal_amount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'payment_status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'shipped_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(CommandItem::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

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
