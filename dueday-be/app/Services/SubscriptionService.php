<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\Task;
use App\Models\User;
use App\Repositories\SubscriptionRepository;
use App\Repositories\UserRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SubscriptionService
{
    // Inject UserRepository alongside the SubscriptionRepository
    public function __construct(
        private SubscriptionRepository $subscriptionRepository,
        private UserRepository $userRepository
    ) {}

    /**
     * Business logic rule to activate a new or extend an existing user subscription.
     */
    public function activateOrExtendUserSubscription(string $userId, string $planName, int $months): Subscription
    {
        $subscriptions = $this->subscriptionRepository->getByUserId($userId);

        // Pick the latest-expiring active subscription deterministically. Falling back to
        // .first() on the Collection would otherwise return whichever row the DB happened
        // to surface first if a user ended up with multiple active rows.
        $latestSubscription = $subscriptions
            ->where('status', 'active')
            ->sortByDesc('expired_at')
            ->first()
            ?? $subscriptions->first();

        $baseDate = ($latestSubscription && $latestSubscription->status === 'active' && $latestSubscription->expired_at)
            ? Carbon::parse($latestSubscription->expired_at)
            : Carbon::now();

        $startedAt = ($latestSubscription && $latestSubscription->status === 'active')
            ? $latestSubscription->started_at
            : Carbon::now();

        $expiredAt = $baseDate->addMonths($months);

        $payload = [
            'plan' => $planName,
            'status' => 'active',
            'started_at' => $startedAt,
            'expired_at' => $expiredAt,
        ];

        if ($latestSubscription) {
            $subscription = $this->subscriptionRepository->update($latestSubscription->id, $payload);
        } else {
            $subscription = $this->createSubscription($userId, $payload);
        }

        $user = $this->userRepository->findById($userId);
        if ($user) {
            $this->userRepository->update($user, [
                'is_subscribed' => true,
            ]);

            $this->syncMissingElearnTasksForUser($user);
        }

        return $subscription;
    }

    public function createSubscription(string $userId, array $data): Subscription
    {
        $data['user_id'] = $userId;
        $data['status'] = $data['status'] ?? 'pending';

        return $this->subscriptionRepository->create($data);
    }

    public function getUserSubscriptions(string $userId)
    {
        return $this->subscriptionRepository->getByUserId($userId);
    }

    public function getSubscriptionForUser(string $userId, string $subscriptionId): ?Subscription
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if ($subscription && $subscription->user_id === $userId) {
            return $subscription;
        }

        return null;
    }

    public function updateSubscription(string $userId, string $subscriptionId, array $data): ?Subscription
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if (! $subscription || $subscription->user_id !== $userId) {
            return null;
        }

        return $this->subscriptionRepository->update($subscriptionId, $data);
    }

    public function deleteSubscription(string $userId, string $subscriptionId): bool
    {
        $subscription = $this->subscriptionRepository->findById($subscriptionId);

        if (! $subscription || $subscription->user_id !== $userId) {
            return false;
        }

        return $this->subscriptionRepository->delete($subscriptionId);
    }

    private function syncMissingElearnTasksForUser(User $user): void
    {
        if (empty($user->nim)) {
            return;
        }

        $hasElearnAssessmentId = Schema::hasColumn('tasks', 'elearn_assessment_id');

        $missingAssignments = DB::table('detail')
            ->join('reg_student', 'detail.reg_student_id', '=', 'reg_student.id')
            ->join('students', 'reg_student.student_id', '=', 'students.id')
            ->join('users', 'students.nim', '=', 'users.nim')
            ->join('assessment', 'detail.assessment_id', '=', 'assessment.id')
            ->where('users.id', $user->id)
            ->select(
                'assessment.id as assessment_id',
                'assessment.title',
                'assessment.description',
                'assessment.date',
                'assessment.time'
            )
            ->orderBy('assessment.id')
            ->get();

        foreach ($missingAssignments as $assignment) {
            $taskQuery = Task::query()
                ->where('user_id', $user->id)
                ->where('source', 'elearn');

            if ($hasElearnAssessmentId) {
                $taskQuery->where('elearn_assessment_id', $assignment->assessment_id);
            } else {
                $taskQuery->where('name', $assignment->title)
                    ->where('description', $assignment->description);

                if ($assignment->date) {
                    $taskQuery->whereDate('due_date', $assignment->date);
                } else {
                    $taskQuery->whereNull('due_date');
                }
            }

            if ($taskQuery->exists()) {
                continue;
            }

            Task::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'tag_id' => null,
                'name' => $assignment->title,
                'due_date' => $assignment->date,
                'due_time' => $assignment->time,
                'priority' => 'medium',
                'status' => 'ongoing',
                'source' => 'elearn',
                'description' => $assignment->description,
                'progress' => 0,
                'goals' => null,
                'goal_points' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ] + ($hasElearnAssessmentId ? [
                'elearn_assessment_id' => $assignment->assessment_id,
            ] : []));
        }
    }
}
