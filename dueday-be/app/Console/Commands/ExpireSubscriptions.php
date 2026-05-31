<?php

namespace App\Console\Commands;

use App\Services\SubscriptionService;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    protected $signature = 'subscriptions:expire-expired';

    protected $description = 'Mark overdue active subscriptions as expired and clear premium access';

    public function __construct(private SubscriptionService $subscriptionService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $expiredCount = $this->subscriptionService->expireDueSubscriptions();

        $this->info(sprintf('Expired %d subscription(s).', $expiredCount));

        return self::SUCCESS;
    }
}
