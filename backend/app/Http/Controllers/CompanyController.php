<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::orderBy('created_at', 'desc')->get();
        return response()->json($companies->map->toFrontendArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'domain' => 'required|unique:companies',
            'address' => 'nullable',
            'bio' => 'nullable',
            'linkedin' => 'nullable|string',
            'facebook' => 'nullable|string',
            'instagram' => 'nullable|string',
            'logoUrl' => 'nullable' // Base64 string coming from frontend
        ]);

        $logoPath = null;
        if (!empty($data['logoUrl']) && str_starts_with($data['logoUrl'], 'data:image')) {
            $logoPath = $this->uploadBase64($data['logoUrl'], 'companies');
        }

        $company = Company::create([
            'name' => $data['name'],
            'domain' => $data['domain'],
            'address' => $data['address'] ?? null,
            'bio' => $data['bio'] ?? null,
            'linkedin' => $data['linkedin'] ?? null,
            'facebook' => $data['facebook'] ?? null,
            'instagram' => $data['instagram'] ?? null,
            'logo_path' => $logoPath
        ]);

        return response()->json($company->toFrontendArray());
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);
        
        $data = $request->validate([
            'name' => 'sometimes|required',
            'domain' => 'sometimes|required|unique:companies,domain,'.$id,
            'address' => 'nullable',
            'bio' => 'nullable',
            'linkedin' => 'nullable|string',
            'facebook' => 'nullable|string',
            'instagram' => 'nullable|string',
            'logoUrl' => 'nullable'
        ]);

        $updateData = [
            'name' => $data['name'] ?? $company->name,
            'domain' => $data['domain'] ?? $company->domain,
            'address' => $data['address'] ?? $company->address,
            'bio' => $data['bio'] ?? $company->bio,
            'linkedin' => $data['linkedin'] ?? $company->linkedin,
            'facebook' => $data['facebook'] ?? $company->facebook,
            'instagram' => $data['instagram'] ?? $company->instagram,
        ];

        if (!empty($data['logoUrl']) && str_starts_with($data['logoUrl'], 'data:image')) {
            // Delete old logo
            if ($company->logo_path) Storage::disk('public')->delete($company->logo_path);
            $updateData['logo_path'] = $this->uploadBase64($data['logoUrl'], 'companies');
        }

        $company->update($updateData);
        return response()->json($company->toFrontendArray());
    }

    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        if ($company->logo_path) Storage::disk('public')->delete($company->logo_path);
        $company->delete();
        return response()->json(['message' => 'Deleted']);
    }

    private function uploadBase64($base64_string, $folder)
    {
        // Split the string on commas: $data[0] is the mime type, $data[1] is the base64 content
        $data = explode(',', $base64_string);
        $image_content = base64_decode($data[1]);
        
        $fileName = Str::random(20) . '.png'; // Simplified assumption
        $path = "$folder/$fileName";
        
        Storage::disk('public')->put($path, $image_content);
        return $path;
    }
}