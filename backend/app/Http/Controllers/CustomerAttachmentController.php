<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CustomerAttachment;
use App\Models\Customer;
use App\Services\CustomerActivityService;
use Illuminate\Support\Facades\Storage;

class CustomerAttachmentController extends Controller
{
    protected $activityService;

    public function __construct(CustomerActivityService $activityService)
    {
        $this->activityService = $activityService;
    }

    public function index($customerId)
    {
        return response()->json(
            CustomerAttachment::with(['creator:id,name', 'employee:id,first_name,last_name'])
                ->where('customer_id', $customerId)
                ->latest()
                ->get()
        );
    }

    public function store(Request $request, $customerId)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'note' => 'nullable|string',
        ]);

        $customer = Customer::findOrFail($customerId);
        $file = $request->file('file');

        $path = $file->storePublicly("crm/customer-attachments/{$customerId}", 'public');

        $data = [
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'note' => $request->note,
        ];

        $user = $request->user();
        if ($user instanceof \App\Models\Employee) {
            $data['employee_id'] = $user->id;
        } else {
            $data['created_by'] = $user->id;
        }

        $attachment = $customer->attachments()->create($data);

        $this->activityService->log($customerId, 'attachment_added', "Attachment added: {$attachment->file_name}");

        return response()->json($attachment, 201);
    }

    public function destroy($attachmentId)
    {
        $attachment = CustomerAttachment::findOrFail($attachmentId);
        
        Storage::disk('public')->delete($attachment->file_path);
        
        $customerId = $attachment->customer_id;
        $fileName = $attachment->file_name;
        
        $attachment->delete();

        $this->activityService->log($customerId, 'attachment_deleted', "Attachment deleted: {$fileName}");

        return response()->noContent();
    }
}
