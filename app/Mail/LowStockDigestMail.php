<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LowStockDigestMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  list<array{product_title: string, brand_name: ?string, size: ?string, color: ?string, stock: int, is_out_of_stock: bool}>  $rows
     */
    public function __construct(
        public int $threshold,
        public int $outCount,
        public int $lowCount,
        public array $rows,
        public string $adminUrl,
    ) {}

    public function envelope(): Envelope
    {
        $total = $this->outCount + $this->lowCount;

        return new Envelope(
            subject: "HARIMI — Alert scorte ({$total}): {$this->outCount} esaurite, {$this->lowCount} basse",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.low-stock-digest',
            with: [
                'threshold' => $this->threshold,
                'outCount' => $this->outCount,
                'lowCount' => $this->lowCount,
                'rows' => $this->rows,
                'adminUrl' => $this->adminUrl,
            ],
        );
    }
}
