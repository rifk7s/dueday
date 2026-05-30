<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
            return view('dashboard-admin', ['user' => $user]);
        }

        // For students, redirect to elearn area (placeholder)
        return redirect()->to('/elearn');
    }
}
