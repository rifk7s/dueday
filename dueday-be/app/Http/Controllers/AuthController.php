<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $this->authService->login(
            $request->input('username'),
            $request->input('password'),
        );

        return response()->json([
            'message' => 'User has logged in',
        ]);
    }
}
