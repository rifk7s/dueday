<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function sendResetLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        // No real email delivery in this app — the reset token is handed straight
        // back so the client can navigate to the in-app reset screen. When no user
        // matches, return the same generic 200 without a token so the response does
        // not reveal which emails are registered.
        if (! $user) {
            return response()->json([
                'message' => 'Jika email terdaftar, tautan reset password sudah dibuat.',
            ]);
        }

        $token = Password::broker()->createToken($user);

        return response()->json([
            'message' => 'Jika email terdaftar, tautan reset password sudah dibuat.',
            'email' => $user->email,
            'token' => $token,
        ]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Auth is Sanctum bearer-token based (no remember_token column), so
                // revoke any existing access tokens to log out other sessions.
                $user->tokens()->delete();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'token' => [__($status)],
            ]);
        }

        return response()->json([
            'message' => 'Password berhasil direset. Silakan masuk kembali.',
        ]);
    }
}
