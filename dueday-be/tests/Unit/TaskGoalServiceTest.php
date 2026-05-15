<?php

use App\Services\TaskGoalService;

test('parseGoals normalizes plain bullet lines into goal points', function () {
    $goalPoints = TaskGoalService::parseGoals("- Buy milk\n- Buy bread\n- Buy eggs");

    expect($goalPoints)->toBe([
        ['id' => 1, 'text' => 'Buy milk', 'completed' => false],
        ['id' => 2, 'text' => 'Buy bread', 'completed' => false],
        ['id' => 3, 'text' => 'Buy eggs', 'completed' => false],
    ]);
});

test('parseGoals keeps checkbox completion state when present', function () {
    $goalPoints = TaskGoalService::parseGoals("- [+] Buy milk\n- [ ] Buy bread\n1. [x] Buy eggs");

    expect($goalPoints)->toBe([
        ['id' => 1, 'text' => 'Buy milk', 'completed' => true],
        ['id' => 2, 'text' => 'Buy bread', 'completed' => false],
        ['id' => 3, 'text' => 'Buy eggs', 'completed' => true],
    ]);
});
