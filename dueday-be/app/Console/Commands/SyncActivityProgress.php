<?php

namespace App\Console\Commands;

use App\Services\ActivityService;
use Illuminate\Console\Command;

class SyncActivityProgress extends Command
{
    protected $signature = 'activities:reset-recurring';

    protected $description = 'Roll completed recurring activities into their next scheduled cycle';

    public function __construct(private ActivityService $activityService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->activityService->handleRecurringActivityResets();

        $this->info('Recurring activity reset pass complete.');

        return self::SUCCESS;
    }
}
