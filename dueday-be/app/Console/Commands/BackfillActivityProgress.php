<?php

namespace App\Console\Commands;

use App\Services\ActivityService;
use Illuminate\Console\Command;

class BackfillActivityProgress extends Command
{
    protected $signature = 'activities:backfill-progress';

    protected $description = 'One-off: backfill progress_started_at and progress for ongoing activities';

    public function __construct(private ActivityService $activityService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $updated = $this->activityService->syncOngoingProgress();

        $this->info("Backfilled {$updated} activities.");

        return self::SUCCESS;
    }
}
