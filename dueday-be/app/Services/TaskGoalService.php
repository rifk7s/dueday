<?php

namespace App\Services;

class TaskGoalService
{
    /**
     * Parse goals text and extract points with completion status
     *
     * Format expected:
     * - [+] Completed point
     * - [ ] Incomplete point
     */
    public static function parseGoals(string $goalsText): array
    {
        $goalPoints = [];
        $lines = explode("\n", trim($goalsText));
        $pointId = 1;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            $completed = false;

            if (preg_match('/^\s*(?:[-*•]|\d+[.)])?\s*\[(?<state>[xX+\s])\]\s*(?<text>.+)$/', $line, $matches)) {
                $completed = in_array($matches['state'], ['x', 'X', '+'], true);
                $text = trim($matches['text']);
            } elseif (preg_match('/^\s*(?:[-*•]|\d+[.)])\s*(?<text>.+)$/', $line, $matches)) {
                $text = trim($matches['text']);
            } else {
                $text = $line;
            }

            if (! empty($text)) {
                $goalPoints[] = [
                    'id' => $pointId,
                    'text' => $text,
                    'completed' => $completed,
                ];
                $pointId++;
            }
        }

        return $goalPoints;
    }

    /**
     * Calculate progress based on goal points
     */
    public static function calculateProgress(array $goalPoints): int
    {
        if (empty($goalPoints)) {
            return 0;
        }

        $completedCount = collect($goalPoints)->filter(fn ($point) => $point['completed'])->count();
        $totalCount = count($goalPoints);

        return $totalCount > 0 ? (int) (($completedCount / $totalCount) * 100) : 0;
    }

    /**
     * Update goal point completion status
     */
    public static function updateGoalPointStatus(array $goalPoints, int $pointId, bool $completed): array
    {
        return collect($goalPoints)
            ->map(function ($point) use ($pointId, $completed) {
                if ($point['id'] === $pointId) {
                    $point['completed'] = $completed;
                }

                return $point;
            })
            ->toArray();
    }

    /**
     * Add a new goal point
     */
    public static function addGoalPoint(array $goalPoints, string $text): array
    {
        $nextId = (collect($goalPoints)->max('id') ?? 0) + 1;

        $goalPoints[] = [
            'id' => $nextId,
            'text' => $text,
            'completed' => false,
        ];

        return $goalPoints;
    }

    /**
     * Remove a goal point by ID
     */
    public static function removeGoalPoint(array $goalPoints, int $pointId): array
    {
        return array_values(
            collect($goalPoints)
                ->reject(fn ($point) => $point['id'] === $pointId)
                ->toArray()
        );
    }

    /**
     * Regenerate goals text from goal_points array
     */
    public static function regenerateGoalsText(array $goalPoints): string
    {
        $lines = collect($goalPoints)
            ->map(fn ($point) => sprintf(
                '- [%s] %s',
                $point['completed'] ? '+' : ' ',
                $point['text']
            ))
            ->toArray();

        return implode("\n", $lines);
    }
}
