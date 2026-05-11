<?php

use App\Models\Task;
use App\Models\User;
use App\Services\TaskGoalService;

beforeEach(function () {
    $this->user = User::factory()->create();
});

describe('Goal Parsing', function () {
    it('parses goal text correctly', function () {
        $goalsText = "- [+] Contoh: Laporan RPL Bab 3\n- [ ] Poin lainnya\n- [+] Done item";
        
        $goalPoints = TaskGoalService::parseGoals($goalsText);
        
        expect($goalPoints)->toHaveCount(3)
            ->and($goalPoints[0])->toEqual([
                'id' => 1,
                'text' => 'Contoh: Laporan RPL Bab 3',
                'completed' => true,
            ])
            ->and($goalPoints[1])->toEqual([
                'id' => 2,
                'text' => 'Poin lainnya',
                'completed' => false,
            ])
            ->and($goalPoints[2])->toEqual([
                'id' => 3,
                'text' => 'Done item',
                'completed' => true,
            ]);
    });

    it('handles empty lines', function () {
        $goalsText = "- [+] Item 1\n\n- [ ] Item 2\n\n";
        
        $goalPoints = TaskGoalService::parseGoals($goalsText);
        
        expect($goalPoints)->toHaveCount(2);
    });
});

describe('Progress Calculation', function () {
    it('calculates progress correctly', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Item 1', 'completed' => true],
            ['id' => 2, 'text' => 'Item 2', 'completed' => true],
            ['id' => 3, 'text' => 'Item 3', 'completed' => false],
            ['id' => 4, 'text' => 'Item 4', 'completed' => false],
        ];
        
        $progress = TaskGoalService::calculateProgress($goalPoints);
        
        expect($progress)->toBe(50); // 2 out of 4 = 50%
    });

    it('returns 0 for empty goals', function () {
        $progress = TaskGoalService::calculateProgress([]);
        
        expect($progress)->toBe(0);
    });

    it('returns 100 when all completed', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Item 1', 'completed' => true],
            ['id' => 2, 'text' => 'Item 2', 'completed' => true],
        ];
        
        $progress = TaskGoalService::calculateProgress($goalPoints);
        
        expect($progress)->toBe(100);
    });
});

describe('Goal Point Management', function () {
    it('updates goal point status', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Item 1', 'completed' => false],
            ['id' => 2, 'text' => 'Item 2', 'completed' => false],
        ];
        
        $updated = TaskGoalService::updateGoalPointStatus($goalPoints, 1, true);
        
        expect($updated[0]['completed'])->toBeTrue()
            ->and($updated[1]['completed'])->toBeFalse();
    });

    it('adds a new goal point', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Item 1', 'completed' => false],
        ];
        
        $updated = TaskGoalService::addGoalPoint($goalPoints, 'New Item');
        
        expect($updated)->toHaveCount(2)
            ->and($updated[1])->toEqual([
                'id' => 2,
                'text' => 'New Item',
                'completed' => false,
            ]);
    });

    it('removes a goal point', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Item 1', 'completed' => false],
            ['id' => 2, 'text' => 'Item 2', 'completed' => false],
            ['id' => 3, 'text' => 'Item 3', 'completed' => false],
        ];
        
        $updated = TaskGoalService::removeGoalPoint($goalPoints, 2);
        $reindexed = array_values($updated);
        
        expect($reindexed)->toHaveCount(2)
            ->and($reindexed[0]['id'])->toBe(1)
            ->and($reindexed[1]['id'])->toBe(3);
    });

    it('regenerates goals text from goal_points', function () {
        $goalPoints = [
            ['id' => 1, 'text' => 'Completed item', 'completed' => true],
            ['id' => 2, 'text' => 'Incomplete item', 'completed' => false],
        ];
        
        $text = TaskGoalService::regenerateGoalsText($goalPoints);
        
        expect($text)->toBe("- [+] Completed item\n- [ ] Incomplete item");
    });
});

describe('Task Creation with Goals', function () {
    it('creates task with goals and calculates progress', function () {
        $goalsText = "- [+] Laporan RPL Bab 3\n- [+] Laporan RPL Bab 4\n- [ ] Laporan RPL Bab 5";
        
       $service = new \App\Services\TaskService(new \App\Repositories\TaskRepository());
       $task = $service->createTask($this->user->id, [
            'id' => \Illuminate\Support\Str::uuid(),
            'task_name' => 'Test Task',
            'date' => now()->addDay(),
            'goals' => $goalsText,
        ]);

        // Task should be created with parsed goal_points
        expect($task)->toBeInstanceOf(Task::class)
            ->and($task->goals)->toBe($goalsText)
            ->and($task->goal_points)->toBeArray()
            ->and(count($task->goal_points))->toBe(3);
    });

    it('retrieves task with goal_points as array', function () {
        $goalsText = "- [+] Item 1\n- [ ] Item 2";
        
       $service = new \App\Services\TaskService(new \App\Repositories\TaskRepository());
       $task = $service->createTask($this->user->id, [
            'id' => \Illuminate\Support\Str::uuid(),
            'task_name' => 'Goal Task',
            'date' => now()->addDay(),
            'goals' => $goalsText,
        ]);

        $retrieved = Task::find($task->id);
        
        expect($retrieved->goal_points)->toBeArray()
            ->and($retrieved->progress)->toBe(50);
    });
});
