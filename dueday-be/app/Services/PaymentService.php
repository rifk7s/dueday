<?php

namespace App\Services;

use App\Models\Payment;
use App\Repositories\PaymentRepository;

class PaymentService
{
    /**
     * Inject both the PaymentRepository and the SubscriptionService to bridge the tables.
     */
    public function __construct(
        private PaymentRepository $paymentRepository,
        private SubscriptionService $subscriptionService
    ) {}

    public function createPayment(string $userId, array $data): Payment
    {
        $data['user_id'] = $userId;
        $data['status'] = $data['status'] ?? 'pending';

        return $this->paymentRepository->create($data);
    }

    public function getUserPayments(string $userId)
    {
        return $this->paymentRepository->getByUserId($userId);
    }

    public function getPaymentForUser(string $userId, string $paymentId): ?Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if ($payment && $payment->user_id === $userId) {
            return $payment;
        }

        return null;
    }

    /**
     * Updates payment attributes and automates premium activations upon successful clearance.
     */
    public function updatePayment(string $userId, string $paymentId, array $data): ?Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (! $payment || $payment->user_id !== $userId) {
            return null;
        }

        // 1. Persist the updated data (e.g. status => 'paid') down into the database via repository
        $updatedPayment = $this->paymentRepository->update($paymentId, $data);

        if (! $updatedPayment) {
            return null;
        }

        if ($updatedPayment->status === 'paid') {
            $subscription = $updatedPayment->subscription;
            $plan = $subscription?->plan ?? 'satu_bulan';
            $months = match ($plan) {
                'satu_tahun' => 12,
                'tiga_bulan' => 3,
                default => 1,
            };

            $this->subscriptionService->activateOrExtendUserSubscription($userId, $plan, $months);
        } elseif (in_array($updatedPayment->status, ['failed', 'refunded', 'cancelled'], true)) {
            // Explicitly do nothing for terminal non-paid statuses.
            // The subscription must remain unchanged when payment fails.
        }

        return $updatedPayment;
    }

    public function deletePayment(string $userId, string $paymentId): bool
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (! $payment || $payment->user_id !== $userId) {
            return false;
        }

        return $this->paymentRepository->delete($paymentId);
    }
}
