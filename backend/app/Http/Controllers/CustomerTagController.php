<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerTag;
use App\Models\Customer;
use Illuminate\Support\Facades\DB;

class CustomerTagController extends Controller
{
    public function index()
    {
        return response()->json(CustomerTag::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:customer_tags,name|max:255',
            'color' => 'nullable|string|max:7',
        ]);

        $validated['created_by'] = $request->user()->id;

        $tag = CustomerTag::create($validated);

        return response()->json($tag, 201);
    }

    public function attach(Request $request, $customerId)
    {
        $request->validate([
            'tags' => 'required|array',
            'tags.*' => 'exists:customer_tags,id',
        ]);

        $customer = Customer::findOrFail($customerId);
        $customer->tags()->syncWithoutDetaching($request->tags);
        
        // Touch customer to update timestamp for sorting
        $customer->touch();

        return response()->json($customer->tags);
    }

    public function detach($customerId, $tagId)
    {
        $customer = Customer::findOrFail($customerId);
        $customer->tags()->detach($tagId);
        
        $customer->touch();

        return response()->noContent();
    }
}
