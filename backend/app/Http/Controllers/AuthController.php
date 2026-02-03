<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User; // Uses default Laravel User model
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Handle login request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();
            
            return response()->json([
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'admin', // Hardcoded role for this specific app context
            ]);
        }

        return response()->json([
            'message' => 'The provided credentials do not match our records.',
        ], 401);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Helper route to generate the first Admin user easily.
     * Visit /api/setup-admin once to create the account.
     */
    public function setupAdmin()
    {
        $email = 'admin@nexus.com';
        
        $user = User::firstOrNew(['email' => $email]);
        $user->name = 'Nexus Admin';
        $user->password = Hash::make('admin'); // Default password matching your React mock
        $user->save();

        return response()->json([
            'message' => 'Admin account setup complete.',
            'credentials' => [
                'email' => $email,
                'password' => 'admin'
            ]
        ]);
    }
}