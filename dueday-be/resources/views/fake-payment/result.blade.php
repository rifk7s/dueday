<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Fake Payment Result</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px}</style>
    </head>
    <body>
        <h1>Fake Payment Result</h1>
        <p>Payment ID: {{ $payment->id }}</p>
        <p>Status: {{ $payment->status }}</p>
        <p>Amount: Rp {{ number_format((float) $payment->amount, 0, ',', '.') }}</p>
        <a href="{{ route('fakepay.index') }}">Back to Payments</a>
    </body>
</html>
