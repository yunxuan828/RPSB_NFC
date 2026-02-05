<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\OcrService;
use App\Models\CustomerNamecard;
use Illuminate\Support\Facades\Storage;

class NamecardController extends Controller
{
    protected $ocrService;

    public function __construct(OcrService $ocrService)
    {
        $this->ocrService = $ocrService;
    }

    public function scan(Request $request)
    {
        $request->validate([
            'front_image' => 'required|image|max:10240', // 10MB max
            'back_image' => 'nullable|image|max:10240',
        ]);

        // 1. Store images
        $frontPath = $request->file('front_image')->store('namecards', 'public');
        $backPath = null;
        if ($request->hasFile('back_image')) {
            $backPath = $request->file('back_image')->store('namecards', 'public');
        }

        // 2. Call OCR Service
        // We need absolute paths for the service to read file contents or attach them
        $absFrontPath = Storage::disk('public')->path($frontPath);
        $absBackPath = $backPath ? Storage::disk('public')->path($backPath) : null;

        try {
            $ocrResult = $this->ocrService->scanNamecard($absFrontPath, $absBackPath);
        } catch (\Exception $e) {
            return response()->json(['error' => 'OCR Service unavailable: ' . $e->getMessage()], 503);
        }

        // 3. Save Namecard Record (Unlinked to customer initially)
        $user = $request->user();
        
        $collectedByEmployeeId = null;
        $createdBy = null;

        if ($user instanceof \App\Models\Employee) {
            $collectedByEmployeeId = $user->id;
        } else {
            // Assume User/Admin
            $createdBy = $user && $user instanceof \App\Models\User ? $user->id : 1; 
        }

        $namecard = CustomerNamecard::create([
            'customer_id' => null,
            'front_image_path' => $frontPath,
            'back_image_path' => $backPath,
            'ocr_raw_text_front' => $ocrResult['raw_text_front'] ?? null,
            'ocr_raw_text_back' => $ocrResult['raw_text_back'] ?? null,
            'ocr_json' => $ocrResult,
            'created_by' => $createdBy,
            'collected_by_employee_id' => $collectedByEmployeeId,
        ]);

        // 4. Return Data
        return response()->json([
            'namecard_id' => $namecard->id,
            'front_image_url' => asset('storage/' . $frontPath),
            'back_image_url' => $backPath ? asset('storage/' . $backPath) : null,
            'extracted_fields' => $ocrResult['extracted_fields'] ?? [],
            'ocr_json' => $ocrResult,
        ]);
    }
}
