<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    public function index()
    {
        $payments = $this->paymentService->getUserPayments(auth()->id());

        return PaymentResource::collection($payments);
    }

    public function show(Payment $payment)
    {
        $payment = $this->paymentService->getPaymentForUser(auth()->id(), $payment->{$payment->getKeyName()});

        if (! $payment) {
            return response(['message' => 'Payment not found'], 404);
        }

        return new PaymentResource($payment);
    }

    public function store(StorePaymentRequest $request)
    {
        $payment = $this->paymentService->createPayment(auth()->id(), $request->validated());

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    public function update(UpdatePaymentRequest $request, Payment $payment)
    {
        $payment = $this->paymentService->updatePayment(auth()->id(), $payment->{$payment->getKeyName()}, $request->validated());

        if (! $payment) {
            return response(['message' => 'Payment not found or not owned by user'], 404);
        }

        return new PaymentResource($payment);
    }

    public function destroy(Payment $payment)
    {
        $deleted = $this->paymentService->deletePayment(auth()->id(), $payment->{$payment->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Payment not found or not owned by user'], 404);
        }

        return response(null, 204);
    }
}
