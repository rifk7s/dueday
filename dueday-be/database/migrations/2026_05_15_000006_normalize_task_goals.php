<?php

use App\Services\TaskGoalService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (DB::table('tasks')->whereNotNull('goals')->orderBy('id')->cursor() as $task) {
            $goalsText = trim((string) $task->goals);

            if ($goalsText === '') {
                continue;
            }

            $goalPoints = TaskGoalService::parseGoals($goalsText);

            DB::table('tasks')
                ->where('id', $task->id)
                ->update([
                    'goal_points' => json_encode($goalPoints),
                    'goals' => TaskGoalService::regenerateGoalsText($goalPoints),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
