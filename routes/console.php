<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('harimi:expire-abandoned-checkouts')
    ->hourly()
    ->withoutOverlapping();

Schedule::command('harimi:send-low-stock-digest')
    ->dailyAt((string) config('harimi.inventory.digest_time', '08:00'))
    ->withoutOverlapping();
