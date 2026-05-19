<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Fake Payment Checkout</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px}</style>
    </head>
    <body>
        @php
        $methodLabels = [
            'bca' => 'BCA',
            'mandiri' => 'Mandiri',
            'gopay' => 'GoPay',
            'dana' => 'Dana',
            'ovo' => 'OVO',
        ];
        $methodValue = strtolower((string) ($payment->method ?? 'bank_transfer'));
        $methodName = $methodLabels[$methodValue] ?? strtoupper($methodValue);
        @endphp

        <h1>Fake Payment Checkout</h1>
        <p>Payment ID: {{ $payment->id }}</p>
        <p>Amount: Rp {{ number_format((float) $payment->amount, 0, ',', '.') }}</p>
        <p>Method: {{ $methodName }}</p>

        <form method="post" action="{{ route('fakepay.confirm', ['payment' => $payment->id]) }}">
        @csrf
        <label>
            <input type="radio" name="status" value="paid" checked> Mark as Paid
        </label>
        <br>
        <label>
            <input type="radio" name="status" value="failed"> Mark as Failed
        </label>
        <br><br>
        <button type="submit">Confirm Payment</button>
        </form>
        <br>
        <a href="{{ route('fakepay.index') }}">Back to Payments</a>
    </body>
</html>
