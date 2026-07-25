<?php

namespace App\Mail;

use App\Models\Command;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Command $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'HARIMI — Ordine '.$this->order->reference,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.order-confirmation',
            with: [
                'order' => $this->order,
            ],
        );
    }
}
