<?php

namespace App\Services;

use App\Models\Payment;
use App\Repositories\PaymentRepository;
use App\Services\SubscriptionService;

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
                ?? 'Paket 1 Bulan';
                
            $amount = (int) ($updatedPayment->amount ?? 0);

            // Default fallbacks (Paket 1 Bulan)
            $months = 1;
            $finalPlanName = 'Paket 1 Bulan';

            // 🔄 CRITICAL FIX: Evaluate from largest to smallest value 
            // to stop the 1-year plan from getting swallowed by the >= 54000 check.
            if (
                str_contains(strtolower($rawPlanName), '1 tahun') || 
                str_contains(strtolower($rawPlanName), '12 bulan') || 
                $amount === 192000
            ) {
                $months = 12;
                $finalPlanName = 'Paket 1 Tahun';
            } 
            elseif (
                str_contains(strtolower($rawPlanName), '3 bulan') || 
                $amount === 54000 || 
                ($amount >= 54000 && $amount < 192000)
            ) {
                $months = 3;
                $finalPlanName = 'Paket 3 Bulan';
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