<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case NotApplicable = 'not_applicable';
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case Refunded = 'refunded';
}
