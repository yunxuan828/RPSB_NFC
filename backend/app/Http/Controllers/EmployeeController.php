<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::orderBy('created_at', 'desc')->get();
        return response()->json($employees->map->toFrontendArray());
    }

    public function show($id)
    {
        // Try to find by Slug first, then by ID
        $employee = Employee::with('company')->where('slug', $id)->first();

        if (!$employee) {
            $employee = Employee::with('company')->find($id);
        }

        if (!$employee) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        if ($employee->status !== 'active') {
            return response()->json(['message' => 'Profile inactive'], 404);
        }

        if (!$employee->company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        return response()->json([
            'user' => $employee->toFrontendArray(),
            'company' => $employee->company->toFrontendArray(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'companyId' => 'required|exists:companies,id',
            'fullName' => 'required',
            'email' => 'required|email|unique:employees,email',
            'jobTitle' => 'required',
            'phone' => 'nullable',
            'whatsapp' => 'nullable',
            'linkedin' => 'nullable',
            'instagram' => 'nullable',
            'facebook' => 'nullable',
            'bio' => 'nullable',
            'status' => 'required|in:active,inactive',
            'avatarUrl' => 'nullable'
        ]);

        $avatarPath = null;
        if (!empty($data['avatarUrl']) && str_starts_with($data['avatarUrl'], 'data:image')) {
            $avatarPath = $this->uploadBase64($data['avatarUrl'], 'avatars');
        }

        // Generate Slug
        $slug = $this->generateSlug($data['fullName']);

        // Generate Profile URL
        $baseUrl = env('APP_URL', 'https://dbc.imritma.com');

        $employee = Employee::create([
            'company_id' => $data['companyId'],
            'full_name' => $data['fullName'],
            'email' => $data['email'],
            'job_title' => $data['jobTitle'],
            'phone' => $data['phone'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? null,
            'slug' => $slug,
            'linkedin' => $data['linkedin'] ?? null,
            'instagram' => $data['instagram'] ?? null,
            'facebook' => $data['facebook'] ?? null,
            'bio' => $data['bio'] ?? null,
            'profile_url' => '', // Will be computed or legacy
            'status' => $data['status'],
            'avatar_path' => $avatarPath
        ]);

        $employee->profile_url = "{$baseUrl}/users/{$slug}";
        $employee->save();

        return response()->json($employee->toFrontendArray());
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        $data = $request->validate([
            'companyId' => 'sometimes|exists:companies,id',
            'fullName' => 'sometimes',
            'email' => 'sometimes|email|unique:employees,email,'.$id,
            'jobTitle' => 'sometimes',
            'phone' => 'nullable',
            'whatsapp' => 'nullable',
            'linkedin' => 'nullable',
            'instagram' => 'nullable',
            'facebook' => 'nullable',
            'bio' => 'nullable',
            'status' => 'sometimes|in:active,inactive',
            'avatarUrl' => 'nullable'
        ]);

        $updateData = [
            'company_id' => $data['companyId'] ?? $employee->company_id,
            'full_name' => $data['fullName'] ?? $employee->full_name,
            'email' => $data['email'] ?? $employee->email,
            'job_title' => $data['jobTitle'] ?? $employee->job_title,
            'phone' => $data['phone'] ?? $employee->phone,
            'whatsapp' => $data['whatsapp'] ?? $employee->whatsapp,
            'linkedin' => $data['linkedin'] ?? $employee->linkedin,
            'instagram' => $data['instagram'] ?? $employee->instagram,
            'facebook' => $data['facebook'] ?? $employee->facebook,
            'bio' => $data['bio'] ?? $employee->bio,
            'status' => $data['status'] ?? $employee->status,
        ];

        // If name changes, we could update slug, but let's keep it stable for now unless empty
        if (empty($employee->slug) && !empty($updateData['full_name'])) {
             $updateData['slug'] = $this->generateSlug($updateData['full_name']);
        }

        if (!empty($data['avatarUrl']) && str_starts_with($data['avatarUrl'], 'data:image')) {
            if ($employee->avatar_path) Storage::disk('public')->delete($employee->avatar_path);
            $updateData['avatar_path'] = $this->uploadBase64($data['avatarUrl'], 'avatars');
        }

        $employee->update($updateData);
        
        // Update legacy profile_url just in case
        if ($employee->slug) {
             $baseUrl = env('APP_URL', 'https://dbc.imritma.com');
             $employee->profile_url = "{$baseUrl}/users/{$employee->slug}";
             $employee->saveQuietly();
        }

        return response()->json($employee->toFrontendArray());
    }

    private function generateSlug($fullName)
    {
        // Lowercase, remove special chars, replace spaces with dots
        $base = strtolower(trim(preg_replace('/[^A-Za-z0-9\s]/', '', $fullName)));
        $base = preg_replace('/\s+/', '.', $base);
        
        if (empty($base)) {
            $base = 'user';
        }

        $slug = $base;
        $count = 1;
        
        // Check uniqueness
        while (Employee::where('slug', $slug)->exists()) {
            $slug = "{$base}.{$count}";
            $count++;
        }
        
        return $slug;
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        if ($employee->avatar_path) Storage::disk('public')->delete($employee->avatar_path);
        $employee->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function uploadBase64($base64_string, $folder)
    {
        $data = explode(',', $base64_string);
        $image_content = base64_decode($data[1]);
        $fileName = Str::random(20) . '.png';
        $path = "$folder/$fileName";
        Storage::disk('public')->put($path, $image_content);
        return $path;
    }
}
