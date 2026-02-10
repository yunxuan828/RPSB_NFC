<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmEmailCampaignRecipient extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function campaign()
    {
        return $this->belongsTo(CrmEmailCampaign::class, 'campaign_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
