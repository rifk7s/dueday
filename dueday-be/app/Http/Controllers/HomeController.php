<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return view('dashboard-admin', ['user' => $user]);
        }

        // For students, redirect to elearn area (placeholder)
        return redirect()->to('/elearn');
    }
}
