<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerActivity;

class CustomerActivityController extends Controller
{
    public function index($customerId)
    {
        return response()->json(
            CustomerActivity::with('creator:id,name')
                ->where('customer_id', $customerId)
                ->latest()
                ->paginate(20)
        );
    }
}
