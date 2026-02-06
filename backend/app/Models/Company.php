<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = ['name', 'domain', 'logo_path', 'bio', 'address', 'linkedin', 'facebook', 'instagram'];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
    
    // Helper to format for React Frontend
    public function toFrontendArray() {
        // Ensure APP_URL is used correctly for asset generation
        $logoUrl = null;
        if ($this->logo_path) {
            // Check if it's already a full URL (e.g. S3) or needs storage prefix
            if (str_starts_with($this->logo_path, 'http')) {
                $logoUrl = $this->logo_path;
            } else {
                // Use Storage::url() which respects filesystem config
                // But for local/public disk, we might need to force the APP_URL
                // asset() uses APP_URL from .env
                $logoUrl = asset('storage/' . $this->logo_path);
            }
        }

        return [
            'id' => (string)$this->id,
            'name' => $this->name,
            'domain' => $this->domain,
            'logoUrl' => $logoUrl,
            'bio' => $this->bio,
            'address' => $this->address,
            'linkedin' => $this->linkedin,
            'facebook' => $this->facebook,
            'instagram' => $this->instagram,
            'createdAt' => $this->created_at->format('Y-m-d'),
        ];
    }
}