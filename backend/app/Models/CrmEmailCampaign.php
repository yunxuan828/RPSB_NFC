<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmEmailCampaign extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'audience_snapshot' => 'array',
        'totals' => 'array',
        'queued_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(CrmEmailTemplate::class);
    }

    public function recipients()
    {
        return $this->hasMany(CrmEmailCampaignRecipient::class, 'campaign_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
