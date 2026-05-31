<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Progress is computed on clients now; the server only rolls completed
// recurring activities into their next scheduled cycle.
Schedule::command('activities:reset-recurring')->everyMinute();

// Keep subscription statuses in sync with their expiry timestamps.
Schedule::command('subscriptions:expire-expired')->everyMinute()->withoutOverlapping();
