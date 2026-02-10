<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmEmailTemplate extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'variables' => 'array',
        'locked_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function campaigns()
    {
        return $this->hasMany(CrmEmailCampaign::class, 'template_id');
    }
}
