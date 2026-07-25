<?php

namespace App\Console\Commands;

use App\Services\Checkout\ExpireAbandonedCheckoutOrders;
use Illuminate\Console\Command;

class ExpireAbandonedCheckoutsCommand extends Command
{
    protected $signature = 'harimi:expire-abandoned-checkouts
                            {--hours= : Override HARIMI_ABANDONED_CHECKOUT_HOURS}
                            {--dry-run : List matching orders without cancelling them}';

    protected $description = 'Cancel unpaid storefront checkout orders older than the abandoned TTL';

    public function handle(ExpireAbandonedCheckoutOrders $expire): int
    {
        $hoursOption = $this->option('hours');
        $hours = is_numeric($hoursOption) ? (int) $hoursOption : null;
        $dryRun = (bool) $this->option('dry-run');

        $result = $expire->handle($hours, $dryRun);

        if ($result['expired'] === 0) {
            $this->info('No abandoned checkout orders to expire.');

            return self::SUCCESS;
        }

        $verb = $dryRun ? 'Would expire' : 'Expired';
        $this->info("{$verb} {$result['expired']} order(s).");

        foreach ($result['references'] as $reference) {
            $this->line(" - {$reference}");
        }

        return self::SUCCESS;
    }
}
