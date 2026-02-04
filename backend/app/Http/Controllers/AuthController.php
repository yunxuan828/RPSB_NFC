<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Handle Admin login request.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::guard('web')->attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::guard('web')->user();
            
            return response()->json([
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => 'admin',
                'type' => 'admin'
            ]);
        }

        return response()->json([
            'message' => 'The provided credentials do not match our records.',
        ], 401);
    }

    /**
     * Handle Employee login request.
     */
    public function employeeLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::guard('employee')->attempt($credentials)) {
            $request->session()->regenerate();
            $employee = Auth::guard('employee')->user();

            if ($employee->status !== 'active') {
                Auth::guard('employee')->logout();
                return response()->json(['message' => 'Account is inactive.'], 403);
            }
            
            return response()->json([
                'id' => (string)$employee->id,
                'name' => $employee->full_name,
                'email' => $employee->email,
                'company_id' => (string)$employee->company_id,
                'role' => 'employee',
                'type' => 'employee'
            ]);
        }

        return response()->json([
            'message' => 'Invalid employee credentials.',
        ], 401);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
        if (Auth::guard('employee')->check()) {
            Auth::guard('employee')->logout();
        } else {
            Auth::guard('web')->logout();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Helper route to generate the first Admin user easily.
     */
    public function setupAdmin()
    {
        $email = 'admin@nexus.com';
        
        $user = User::firstOrNew(['email' => $email]);
        $user->name = 'Nexus Admin';
        $user->password = Hash::make('admin'); 
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
