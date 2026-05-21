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

        // 2. Intercept check: If payment just updated successfully to 'paid', link the subscription
        if ($updatedPayment->status === 'paid') {

            // Read target properties dynamically across fallback column configurations
            $rawPlanName = $updatedPayment->plan_name
                ?? $updatedPayment->plan
                ?? $updatedPayment->plan_duration
                ?? 'satu_bulan';

            $amount = (int) ($updatedPayment->amount ?? 0);

            $months = 1;
            $finalPlanName = 'satu_bulan';

            $lower = strtolower($rawPlanName);
            if (str_contains($lower, '1 tahun') || str_contains($lower, '12 bulan') || str_contains($lower, 'satu_tahun') || $amount === 192000) {
                $months = 12;
                $finalPlanName = 'satu_tahun';
            } elseif (str_contains($lower, '3 bulan') || str_contains($lower, 'tiga_bulan') || $amount === 54000 || ($amount >= 54000 && $amount < 192000)) {
                $months = 3;
                $finalPlanName = 'tiga_bulan';
            }

            // 3. Delegate to SubscriptionService to save into your subscription "plan" column
            $this->subscriptionService->activateOrExtendUserSubscription(
                $userId,
                $finalPlanName,
                $months
            );
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
