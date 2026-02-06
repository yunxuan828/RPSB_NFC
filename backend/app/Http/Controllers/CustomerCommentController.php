<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerComment;
use App\Models\Customer;
use App\Services\CustomerActivityService;

class CustomerCommentController extends Controller
{
    protected $activityService;

    public function __construct(CustomerActivityService $activityService)
    {
        $this->activityService = $activityService;
    }

    public function index($customerId)
    {
        return response()->json(
            CustomerComment::with(['creator:id,name', 'employee:id,first_name,last_name'])
                ->where('customer_id', $customerId)
                ->latest()
                ->paginate(20)
        );
    }

    public function store(Request $request, $customerId)
    {
        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $customer = Customer::findOrFail($customerId);

        $data = [
            'body' => $validated['body'],
        ];

        $user = $request->user();
        if ($user instanceof \App\Models\Employee) {
            $data['employee_id'] = $user->id;
        } else {
            $data['created_by'] = $user->id;
        }

        $comment = $customer->comments()->create($data);

        $this->activityService->log($customerId, 'comment', 'Comment added', ['comment_id' => $comment->id]);

        return response()->json($comment->load(['creator:id,name', 'employee:id,first_name,last_name']), 201);
    }

    public function destroy(Request $request, $commentId)
    {
        $comment = CustomerComment::findOrFail($commentId);
        
        $user = $request->user();
        
        $isOwner = false;
        if ($user instanceof \App\Models\Employee) {
            if ($comment->employee_id === $user->id) $isOwner = true;
        } else {
            if ($comment->created_by === $user->id) $isOwner = true;
            // Admins might delete any comment?
             if ($user instanceof \App\Models\User) $isOwner = true; // Assume admin
        }

        if (!$isOwner) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();
        
        return response()->noContent();
    }
}
