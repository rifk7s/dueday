<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

    /**
     * Decode uploaded screenshot via goqr.me and verify the transaction (Sandbox Mode).
     */
    public function scan(Request $request)
    {
        // Check if the web simulation string is passed directly
        $qrText = $request->input('mock_string');

        if (!$qrText) {
            $request->validate([
                'file' => 'required|image|max:4096',
            ]);

            $file = $request->file('file');
            $response = Http::attach(
                'file', 
                file_get_contents($file->getRealPath()), 
                $file->getClientOriginalName()
            )->post('https://api.qrserver.com/v1/read-qr-code/');

            if ($response->failed()) {
                return response(['message' => 'Gagal terhubung dengan server decoder QRIS.'], 502);
            }

            $data = $response->json();
            $qrText = $data[0]['symbol'][0]['data'] ?? null;
        }

        if (!$qrText || !str_starts_with($qrText, 'DUEDAY_MOCK_PAYMENT')) {
            return response(['message' => 'QRIS Code tidak terbaca atau tidak ditujukan untuk sandbox.'], 400);
        }

        $parts = explode('|', $qrText);
        $parsedAmount = 0;
        foreach ($parts as $part) {
            if (str_starts_with($part, 'AMOUNT:')) {
                $parsedAmount = (int) substr($part, 7);
            }
        }

        $payment = Payment::where('user_id', auth()->id())
            ->where('status', 'pending')
            ->where('amount', $parsedAmount)
            ->latest()
            ->first();

        if (!$payment) {
            return response(['message' => 'Tidak ditemukan transaksi tertunda dengan nominal ini.'], 404);
        }

        $updatedPayment = $this->paymentService->updatePayment(
            auth()->id(), 
            $payment->{$payment->getKeyName()}, 
            ['status' => 'paid']
        );

        return response([
            'message' => 'Pembayaran Berhasil Terverifikasi!',
            'payment' => new PaymentResource($updatedPayment)
        ], 200);
    }
}