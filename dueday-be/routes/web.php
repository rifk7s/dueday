<?php

use App\Http\Controllers\Admin\ElearnController;
use App\Http\Controllers\ElearnController as StudentElearnController;
use App\Http\Controllers\FakePaymentController;
use App\Http\Controllers\HomeController;
use App\Http\Middleware\IsAdmin;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

// Lightweight login routes (simple auth against `users` table). No Breeze required.
Route::get('/login', function () {
    return view('auth.login');
})->name('login');

Route::post('/login', function (Request $request) {
    // Authenticate by `name` (plain user name) against Elearn tables first.
    $data = $request->validate([
        'name' => ['required', 'string'],
        'password' => ['required'],
    ]);

    $name = $data['name'];
    $password = $data['password'];

    // 1) Try Elearn admin table. Admin status is granted here, after the admin
    //    password is verified, via the guarded `is_admin` column — never derived
    //    from the user-editable `name`.
    $admin = DB::table('admin')->where('name', $name)->first();
    if ($admin && Hash::check($password, $admin->password)) {
        $user = User::updateOrCreate(
            ['name' => $admin->name],
            [
                'email' => ($admin->name).'@elearn.local',
                'username' => str()->slug($admin->name, '_'),
                'password' => $admin->password,
            ]
        );

        // `is_admin` is guarded (not mass-assignable), so set it explicitly.
        $user->forceFill(['is_admin' => true])->save();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    // 2) Try Elearn students table (student_name column)
    $student = DB::table('students')->where('student_name', $name)->first();
    if ($student && Hash::check($password, $student->password)) {
        $user = User::updateOrCreate(
            ['name' => $student->student_name],
            [
                'email' => ($student->student_name).'@elearn.local',
                'username' => str()->slug($student->student_name, '_'),
                'nim' => $student->nim,
                'password' => $student->password,
            ]
        );

        // Students are never admins; keep the guarded flag explicitly false.
        $user->forceFill(['is_admin' => false])->save();

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    // No name-based `Auth::attempt` fallback: authenticating an arbitrary `users`
    // row by its editable `name` would let a renamed user impersonate the admin.
    return back()->withErrors(['name' => 'The provided credentials do not match our records.']);
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->route('login');
})->name('logout');

Route::get('/', function () {
    if (! auth()->check()) {
        if (Route::has('login')) {
            return redirect()->route('login');
        }

        return view('welcome');
    }

    return redirect()->route('dashboard');
});

Route::get('/dashboard', [HomeController::class, 'dashboard'])->middleware('auth')->name('dashboard');

// Student-facing Elearn area
Route::get('/elearn', [StudentElearnController::class, 'index'])->middleware('auth')->name('elearn.index');
Route::post('/elearn/details/{detail}/submit', [StudentElearnController::class, 'submit'])->middleware('auth')->name('elearn.details.submit');

// (registration removed — app uses seeded Elearn users and lightweight login only)

// Admin elearn routes
Route::prefix('admin')->middleware(['auth', IsAdmin::class])->group(function () {
    Route::get('elearn/majors', [ElearnController::class, 'majors'])->name('admin.elearn.majors');
    Route::get('elearn/majors/{major}/assignments', [ElearnController::class, 'assignments'])->name('admin.elearn.assignments');
    Route::get('elearn/majors/{major}/assignments/create', [ElearnController::class, 'create'])->name('admin.elearn.assignments.create');
    Route::post('elearn/majors/{major}/assignments', [ElearnController::class, 'store'])->name('admin.elearn.assignments.store');
    Route::get('elearn/majors/{major}/assignments/{assessment}/edit', [ElearnController::class, 'edit'])->name('admin.elearn.assignments.edit');
    Route::put('elearn/majors/{major}/assignments/{assessment}', [ElearnController::class, 'update'])->name('admin.elearn.assignments.update');
    Route::delete('elearn/majors/{major}/assignments/{assessment}', [ElearnController::class, 'destroy'])->name('admin.elearn.assignments.destroy');
});

// Local fake payment flow (development only)
Route::prefix('fake-pay')->group(function () {
    Route::get('/payments', [FakePaymentController::class, 'index'])->name('fakepay.index');
    Route::get('/checkout/{payment}', [FakePaymentController::class, 'checkout'])->name('fakepay.checkout');
    Route::post('/confirm/{payment}', [FakePaymentController::class, 'confirm'])->name('fakepay.confirm');
});
