<?php

namespace App\Services;

use App\Models\Payment;
use App\Repositories\PaymentRepository;

class PaymentService
{
    public function __construct(private PaymentRepository $paymentRepository) {}

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

    public function updatePayment(string $userId, string $paymentId, array $data): ?Payment
    {
        $payment = $this->paymentRepository->findById($paymentId);

        if (! $payment || $payment->user_id !== $userId) {
            return null;
        }

        return $this->paymentRepository->update($paymentId, $data);
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
