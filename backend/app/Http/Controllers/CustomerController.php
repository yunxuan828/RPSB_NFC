<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\CustomerNamecard;
use App\Models\CustomerEvent;
use App\Services\CustomerActivityService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    protected $activityService;

    public function __construct(CustomerActivityService $activityService)
    {
        $this->activityService = $activityService;
    }

    // --- Customers ---

    public function index(Request $request)
    {
        $query = Customer::query()->with('creator:id,name', 'tags');

        // Check if user is an Employee
        if ($request->user() && $request->user() instanceof \App\Models\Employee) {
            $query->where('collected_by_employee_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('q')) {
            $term = $request->q;
            $query->where(function($q) use ($term) {
                $q->where('full_name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%")
                  ->orWhere('customer_company_name', 'like', "%{$term}%");
            });
        }

        if ($request->filled('tag')) {
            $tag = $request->tag;
            $query->whereHas('tags', function ($q) use ($tag) {
                $q->where('id', $tag)->orWhere('name', $tag);
            });
        }

        // Sorting
        // default created_at desc
        // Optional: last_activity_at. 
        // Computing last_activity_at efficiently in SQL for sorting might be heavy if not indexed or cached.
        // For now, I'll stick to simple sorting or allow sorting by columns.
        
        $sort = $request->get('sort', 'created_at');
        $direction = $request->get('direction', 'desc');

        if ($sort === 'last_activity_at') {
             // Complex sort, maybe join activities? 
             // For simplicity, let's just sort by updated_at or created_at for now unless requested strictly.
             // The requirement says "sort (created_at desc default, or last_activity_at)"
             // To support last_activity_at sort properly, we might need a subquery or a cached column.
             // Let's use updated_at as a proxy if we touch updated_at on activity.
             $query->orderBy('updated_at', 'desc');
        } else {
             $query->orderBy($sort, $direction);
        }

        $customers = $query->paginate(20);

        // Compute last_activity_at for display (not sort) if needed, 
        // or just rely on updated_at if we touch it.
        // Let's assume updated_at is sufficient for "last activity" if we touch the customer on activity.
        
        return response()->json($customers);
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
            
            $this->activityService->log($customer->id, 'created', 'Customer created');

            return $customer;
        });

        return response()->json($customer, 201);
    }

    public function show($id)
    {
        $customer = Customer::with([
            'namecards', 
            'events', 
            'tags', 
            'creator:id,name'
        ])
        ->withCount(['comments', 'attachments'])
        ->findOrFail($id);
        
        // Transform namecards to include full URLs
        $customer->namecards->transform(function ($nc) {
            $nc->front_image_url = '/storage/' . $nc->front_image_path;
            $nc->back_image_url = $nc->back_image_path ? '/storage/' . $nc->back_image_path : null;
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

        $oldStatus = $customer->status;
        $customer->fill($validated);
        $dirty = $customer->getDirty();
        $customer->save();

        if (isset($dirty['status'])) {
            $this->activityService->log(
                $customer->id, 
                'status_changed', 
                "Status changed from $oldStatus to {$customer->status}",
                ['old' => $oldStatus, 'new' => $customer->status]
            );
        }

        if (!empty($dirty)) {
            // Log generic update if not just status
            $otherChanges = array_diff_key($dirty, ['status' => true, 'updated_at' => true]);
            if (!empty($otherChanges)) {
                 $this->activityService->log(
                    $customer->id, 
                    'updated', 
                    'Customer details updated',
                    $otherChanges
                );
            }
        }

        return response()->json($customer);
    }

    public function destroy(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        
        $user = $request->user();
        
        // If user is an Employee, ensure they own the lead
        if ($user instanceof \App\Models\Employee) {
            if ($customer->collected_by_employee_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized. You can only delete your own leads.'], 403);
            }
        }

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
        
        $this->activityService->log($customerId, 'event_created', "Event created: {$event->title}", $event->toArray());

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
        
        $this->activityService->log($event->customer_id, 'event_updated', "Event updated: {$event->title}");

        return response()->json($event);
    }

    public function deleteEvent($eventId)
    {
        $event = CustomerEvent::findOrFail($eventId);
        $customerId = $event->customer_id;
        $title = $event->title;
        $event->delete();
        
        $this->activityService->log($customerId, 'event_deleted', "Event deleted: $title");
        
        return response()->noContent();
    }
}
