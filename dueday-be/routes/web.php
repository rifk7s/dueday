<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FakePaymentController;

Route::get('/', function () {
    return view('welcome');
});

// Local fake payment flow (development only)
Route::prefix('fake-pay')->group(function () {
    Route::get('/payments', [FakePaymentController::class, 'index'])->name('fakepay.index');
    Route::get('/checkout/{payment}', [FakePaymentController::class, 'checkout'])->name('fakepay.checkout');
    Route::post('/confirm/{payment}', [FakePaymentController::class, 'confirm'])->name('fakepay.confirm');
});
