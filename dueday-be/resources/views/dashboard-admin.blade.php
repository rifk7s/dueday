@extends('layouts.app')

@section('content')
    <div class="container">
        <h1>Admin Dashboard</h1>
        <p>Welcome, {{ $user->name }}</p>
        <div style="margin-top:1rem;">
            <a href="{{ route('admin.elearn.majors') }}" style="display:inline-block;margin-right:1rem;padding:0.5rem 1rem;border:1px solid #333;border-radius:4px;text-decoration:none;">Manage Elearn</a>
            <a href="{{ route('fakepay.index') }}" style="display:inline-block;padding:0.5rem 1rem;border:1px solid #333;border-radius:4px;text-decoration:none;">Payments</a>
        </div>
    </div>
@endsection
