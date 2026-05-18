<?php

namespace App\Repositories;

use App\Models\Payment;
use Illuminate\Support\Str;

class PaymentRepository
{
    public function create(array $data): Payment
    {
        $data['id'] = $data['id'] ?? (string) Str::uuid();

        return Payment::create($data);
    }

    public function findById(string $id): ?Payment
    {
        return Payment::find($id);
    }

    public function getByUserId(string $userId)
    {
        return Payment::where('user_id', $userId)->latest()->get();
    }

    public function update(string $id, array $data): ?Payment
    {
        $payment = $this->findById($id);

        if (! $payment) {
            return null;
        }

        $payment->fill($data);
        $payment->save();

        return $payment;
    }

    public function delete(string $id): bool
    {
        $payment = $this->findById($id);

        if (! $payment) {
            return false;
        }

        return (bool) $payment->delete();
    }
}
