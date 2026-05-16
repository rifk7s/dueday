<?php

namespace App\Console\Commands;

use App\Services\ActivityService;
use Illuminate\Console\Command;

class SyncActivityProgress extends Command
{
    protected $signature = 'activities:sync-progress';

    protected $description = 'Sync database progress for ongoing activities';

    public function __construct(private ActivityService $activityService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $updated = $this->activityService->syncOngoingProgress();

        $this->info("Updated {$updated} ongoing activities.");

        return self::SUCCESS;
    }
}