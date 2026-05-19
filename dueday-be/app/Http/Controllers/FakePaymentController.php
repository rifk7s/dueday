<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class FakePaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    // Show all payments so local testing can be done from one page.
    public function index()
    {
        $payments = Payment::query()
            ->with([
                'user:id,name,username,nickname',
                'subscription:id,plan',
            ])
            ->latest('created_at')
            ->limit(200)
            ->get();

        return view('fake-payment.index', ['payments' => $payments]);
    }

    // Show a simple checkout page for a created payment
    public function checkout(string $paymentId)
    {
        $payment = Payment::find($paymentId);

        // Fake checkout is ID-based so it can be opened directly in the browser.
        if (! $payment) {
            return response('Payment not found', 404);
        }

        return view('fake-payment.checkout', ['payment' => $payment]);
    }

    // Simulate the user confirming payment on the fake gateway
    public function confirm(Request $request, string $paymentId)
    {
        $status = $request->input('status', 'paid');

        $payment = Payment::find($paymentId);

        if (! $payment) {
            return response('Payment not found', 404);
        }

        $updated = $this->paymentService->updatePayment($payment->user_id, $paymentId, ['status' => $status]);

        return view('fake-payment.result', ['payment' => $updated]);
    }
}
