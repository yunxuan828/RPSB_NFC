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
        return [
            'id' => (string)$this->id,
            'name' => $this->name,
            'domain' => $this->domain,
            'logoUrl' => $this->logo_path ? asset('storage/' . $this->logo_path) : null,
            'bio' => $this->bio,
            'address' => $this->address,
            'linkedin' => $this->linkedin,
            'facebook' => $this->facebook,
            'instagram' => $this->instagram,
            'createdAt' => $this->created_at->format('Y-m-d'),
        ];
    }
}