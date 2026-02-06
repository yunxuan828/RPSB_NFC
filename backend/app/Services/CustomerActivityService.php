<?php

namespace App\Services;

use App\Models\CustomerActivity;
use Illuminate\Support\Facades\Auth;

class CustomerActivityService
{
    public function log($customerId, $type, $title = null, $payload = null)
    {
        $creatorId = null;
        $actorInfo = null;

        if (Auth::check()) {
            $user = Auth::user();
            // Check class name properly
            if ($user instanceof \App\Models\User) {
                $creatorId = $user->id;
                $actorInfo = ['name' => $user->name, 'email' => $user->email, 'type' => 'admin'];
            } elseif ($user instanceof \App\Models\Employee) {
                $actorInfo = ['name' => $user->first_name . ' ' . $user->last_name, 'email' => $user->email, 'type' => 'employee', 'id' => $user->id];
            }
        }

        // Ensure payload is array
        $finalPayload = is_array($payload) ? $payload : ($payload ? ['data' => $payload] : []);
        
        if ($actorInfo) {
            $finalPayload['actor'] = $actorInfo;
        }

        return CustomerActivity::create([
            'customer_id' => $customerId,
            'type' => $type,
            'title' => $title,
            'payload' => $finalPayload,
            'created_by' => $creatorId,
        ]);
    }
}
