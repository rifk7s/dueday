<?php

namespace App\Console\Commands;

use App\Repositories\ActivityRepository;
use Illuminate\Console\Command;

class ListOngoingActivities extends Command
{
    protected $signature = 'activities:list-ongoing';

    protected $description = 'List activities with status ongoing';

    public function __construct(private ActivityRepository $activityRepository)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $rows = [];
        foreach ($this->activityRepository->getOngoingActivities() as $a) {
            $rows[] = [
                'id' => $a->id,
                'name' => $a->activity_name,
                'status' => $a->status,
                'progress' => $a->progress,
                'progress_started_at' => $a->progress_started_at?->toDateTimeString() ?? null,
                'tanggal' => $a->tanggal?->format('Y-m-d') ?? null,
                'time_start' => $a->time_start,
                'time_end' => $a->time_end,
            ];
        }

        if (empty($rows)) {
            $this->info('No ongoing activities found.');
            return self::SUCCESS;
        }

        $this->table(['ID', 'Name', 'Status', 'Progress', 'ProgressStartedAt', 'Tanggal', 'TimeStart', 'TimeEnd'], $rows);

        return self::SUCCESS;
    }
}
