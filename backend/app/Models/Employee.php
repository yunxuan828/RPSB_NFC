<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'company_id', 'full_name', 'email', 'job_title', 
        'phone', 'whatsapp', 'linkedin', 'instagram', 'facebook', 'bio', 
        'profile_url', 'avatar_path', 'status', 'slug'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    // Helper to format for React Frontend
    public function toFrontendArray() {
        // Preferred URL format: https://dbc.imritma.com/users/slug
        // Fallback to local if env not set
        $baseUrl = env('APP_URL', 'https://dbc.imritma.com');
        
        if ($this->slug) {
            $profileUrl = "{$baseUrl}/users/{$this->slug}";
        } else {
             $profileUrl = "{$baseUrl}/users/{$this->id}";
        }

        return [
            'id' => (string)$this->id,
            'companyId' => (string)$this->company_id,
            'fullName' => $this->full_name,
            'email' => $this->email,
            'slug' => $this->slug,
            'jobTitle' => $this->job_title,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,

            'linkedin' => $this->linkedin,
            'instagram' => $this->instagram,
            'facebook' => $this->facebook,
            'bio' => $this->bio,
            'profileUrl' => $profileUrl,
            'avatarUrl' => $this->avatar_path ? asset('storage/' . $this->avatar_path) : null,
            'status' => $this->status,
        ];
    }
}
