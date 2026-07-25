<?php

namespace App\Console\Commands;

use App\Services\Inventory\SendLowStockDigest;
use Illuminate\Console\Command;

class SendLowStockDigestCommand extends Command
{
    protected $signature = 'harimi:send-low-stock-digest
                            {--dry-run : List recipients and counts without sending mail}
                            {--force : Send even when digest is disabled in config}';

    protected $description = 'Email staff a digest of out-of-stock and low-stock variants';

    public function handle(SendLowStockDigest $digest): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        $result = $digest->handle($dryRun, $force);

        if ($result['skipped']) {
            $message = match ($result['reason']) {
                'disabled' => 'Low-stock digest is disabled (set HARIMI_LOW_STOCK_DIGEST_ENABLED=true or use --force).',
                'no_alerts' => 'No low-stock variants — digest not sent.',
                'no_recipients' => 'No staff recipients configured — digest not sent.',
                default => 'Digest skipped.',
            };
            $this->info($message);

            return self::SUCCESS;
        }

        $verb = $dryRun ? 'Would send' : 'Sent';
        $this->info("{$verb} low-stock digest to {$result['sent']} recipient(s) ({$result['out_count']} out, {$result['low_count']} low).");

        foreach ($result['recipients'] as $email) {
            $this->line(" - {$email}");
        }

        return self::SUCCESS;
    }
}
