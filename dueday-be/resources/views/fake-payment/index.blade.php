<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Fake Payments</title>
        <style>
        body { font-family: Arial, Helvetica, sans-serif; padding: 24px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .actions { display: flex; gap: 8px; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .status-pending { color: #8a6d3b; }
        .status-paid { color: #2e7d32; }
        .status-failed { color: #c62828; }
        .status-refunded { color: #1565c0; }
        </style>
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
        @endphp

        <div class="topbar">
        <h1>Fake Payments</h1>
        <a href="{{ route('fakepay.index') }}">Reload</a>
        </div>

        <p>Newest payments are shown first. Refresh this page to see newly created payments.</p>

        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Name</th>
                    <th>Subscription</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($payments as $payment)
                    <tr>
                        <td>{{ $payment->id }}</td>
                        <td>
                        <small>{{ $payment->user_id }}</small>
                        </td>
                        <td>
                            {{ $payment->user?->name ?? $payment->user?->username ?? $payment->user?->nickname ?? 'Unknown User' }}
                        </td>
                        <td>{{ $payment->subscription_id }}</td>
                        <td>{{ $payment->subscription?->plan ?? 'N/A' }}</td>
                        <td>Rp {{ number_format((float) $payment->amount, 0, ',', '.') }}</td>
                        <td>
                            {{ $methodLabels[strtolower((string) $payment->method)] ?? strtoupper((string) $payment->method) }}
                        </td>
                        <td class="status-{{ $payment->status }}">{{ $payment->status }}</td>
                        <td>{{ $payment->created_at }}</td>
                        <td>
                            <div class="actions">
                                <a href="{{ route('fakepay.checkout', ['payment' => $payment->id]) }}">Open Checkout</a>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10">No payments yet.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </body>
</html>
