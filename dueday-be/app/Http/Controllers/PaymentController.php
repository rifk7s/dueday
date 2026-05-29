<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * List payments
     *
     * Display a listing of the authenticated user's payments.
     */
    public function index()
    {
        $payments = $this->paymentService->getUserPayments(auth()->id());

        return PaymentResource::collection($payments);
    }

    /**
     * Create payment
     *
     * Store a newly created payment resource in storage.
     */
    public function store(StorePaymentRequest $request)
    {
        $payment = $this->paymentService->createPayment(auth()->id(), $request->validated());

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    /**
     * Get payment
     *
     * Display the specified payment resource if owned by the user.
     */
    public function show(Payment $payment)
    {
        $payment = $this->paymentService->getPaymentForUser(auth()->id(), $payment->{$payment->getKeyName()});

        if (! $payment) {
            return response(['message' => 'Payment not found'], 404);
        }

        return new PaymentResource($payment);
    }

    /**
     * Update payment
     *
     * Update the specified payment resource status/details manually.
     */
    public function update(UpdatePaymentRequest $request, Payment $payment)
    {
        $payment = $this->paymentService->updatePayment(auth()->id(), $payment->{$payment->getKeyName()}, $request->validated());

        if (! $payment) {
            return response(['message' => 'Payment not found or not owned by user'], 404);
        }

        return new PaymentResource($payment);
    }

    /**
     * Delete payment
     *
     * Remove the specified payment resource from storage.
     */
    public function destroy(Payment $payment)
    {
        $deleted = $this->paymentService->deletePayment(auth()->id(), $payment->{$payment->getKeyName()});

        if (! $deleted) {
            return response(['message' => 'Payment not found or not owned by user'], 404);
        }

        return response(null, 204);
    }

    /**
     * Verify QRIS payment
     *
     * Securely verify a frontend pre-decoded QRIS string. Replaces file upload
     * streaming with lightweight string checking.
     */
    public function scan(Request $request)
    {
        // 1. Validate that the string payload data is present
        $request->validate([
            'qr_data' => 'required|string',
        ]);

        $qrText = $request->input('qr_data');

        // 2. Safeguard structural integrity against unexpected QR payloads
        if (! str_starts_with($qrText, 'DUEDAY_MOCK_PAYMENT')) {
            return response(['message' => 'Format string QRIS tidak valid atau tidak dikenali oleh sandbox.'], 400);
        }

        // 3. Extract parameters cleanly out of the decoded string structure
        $parts = explode('|', $qrText);
        $parsedAmount = 0;
        foreach ($parts as $part) {
            if (str_starts_with($part, 'AMOUNT:')) {
                $parsedAmount = (int) substr($part, 7);
            }
        }

        // 4. Verify that a matching transaction record actually exists for the current user
        $payment = Payment::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->where('amount', $parsedAmount)
            ->latest()
            ->first();

        if (! $payment) {
            return response(['message' => 'Tidak ditemukan transaksi gantung dengan nominal matching.'], 404);
        }

        // 5. Commit transaction updates securely
        $updatedPayment = $this->paymentService->updatePayment(
            auth()->id(),
            $payment->{$payment->getKeyName()},
            ['status' => 'paid']
        );

        return response([
            'message' => 'Pembayaran Berhasil Terverifikasi!',
            'payment' => new PaymentResource($updatedPayment),
        ], 200);
    }
}
