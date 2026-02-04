<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerNamecard;
use App\Models\CustomerEvent;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    // --- Customers ---

    public function index(Request $request)
    {
        $query = Customer::query()->with('creator:id,name');

        // Check if user is an Employee
        if ($request->user() && $request->user() instanceof \App\Models\Employee) {
            $query->where('collected_by_employee_id', $request->user()->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('q')) {
            $term = $request->q;
            $query->where(function($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%")
                  ->orWhere('customer_company_name', 'like', "%{$term}%");
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'customer_company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'website' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'status' => 'in:lead,active,silent,inactive',
            'namecard_id' => 'nullable|exists:customer_namecards,id'
        ]);

        // Logic for Employee vs Admin ownership
        $user = $request->user();
        if ($user instanceof \App\Models\Employee) {
            $validated['collected_by_employee_id'] = $user->id;
            // Employees don't have a 'created_by' user ID link, so we leave it null or handle it
            $validated['created_by'] = null; 
        } else {
            $validated['created_by'] = $user->id;
        }

        $namecardId = $request->namecard_id ?? null;
        unset($validated['namecard_id']);

        $customer = DB::transaction(function () use ($validated, $namecardId) {
            $customer = Customer::create($validated);

            if ($namecardId) {
                $nc = CustomerNamecard::find($namecardId);
                if ($nc) {
                    $nc->update(['customer_id' => $customer->id]);
                }
            }
            return $customer;
        });

        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = Customer::with(['namecards', 'events', 'creator:id,name'])->findOrFail($id);
        
        // Transform namecards to include full URLs
        $customer->namecards->transform(function ($nc) {
            $nc->front_image_url = asset('storage/' . $nc->front_image_path);
            $nc->back_image_url = $nc->back_image_path ? asset('storage/' . $nc->back_image_path) : null;
            return $nc;
        });

        return response()->json($customer);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        
        $validated = $request->validate([
            'full_name' => 'nullable|string|max:255',
            'customer_company_name' => 'nullable|string|max:255',
            'job_title' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'whatsapp' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'website' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
            'status' => 'in:lead,active,silent,inactive',
        ]);

        $customer->update($validated);

        return response()->json($customer);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();
        return response()->noContent();
    }

    // --- Events ---

    public function listEvents($customerId)
    {
        return response()->json(
            CustomerEvent::where('customer_id', $customerId)->latest('start_at')->get()
        );
    }

    public function storeEvent(Request $request, $customerId)
    {
        Customer::findOrFail($customerId); // Ensure exists

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_at' => 'required|date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'all_day' => 'boolean',
            'type' => 'in:birthday,follow_up,meeting,reminder',
            'notes' => 'nullable|string',
        ]);

        $validated['customer_id'] = $customerId;
        $validated['created_by'] = $request->user()->id;

        $event = CustomerEvent::create($validated);

        return response()->json($event, 201);
    }

    public function updateEvent(Request $request, $eventId)
    {
        $event = CustomerEvent::findOrFail($eventId);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'start_at' => 'date',
            'end_at' => 'nullable|date|after_or_equal:start_at',
            'all_day' => 'boolean',
            'type' => 'in:birthday,follow_up,meeting,reminder',
            'notes' => 'nullable|string',
        ]);

        $event->update($validated);

        return response()->json($event);
    }

    public function deleteEvent($eventId)
    {
        $event = CustomerEvent::findOrFail($eventId);
        $event->delete();
        return response()->noContent();
    }
}
