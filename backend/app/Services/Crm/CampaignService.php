<?php

namespace App\Services\Crm;

use App\Models\CrmEmailCampaign;
use App\Models\CrmEmailCampaignRecipient;
use App\Models\Customer;
use App\Jobs\SendCampaignJob;
use Illuminate\Support\Facades\DB;

class CampaignService
{
    public function buildAudienceQuery($criteria)
    {
        $query = Customer::query();

        if (!empty($criteria['status'])) {
            // Ensure array
            $statuses = is_array($criteria['status']) ? $criteria['status'] : [$criteria['status']];
            $query->whereIn('status', $statuses);
        }

        if (!empty($criteria['tags'])) {
            $tagIds = is_array($criteria['tags']) ? $criteria['tags'] : [$criteria['tags']];
            $query->whereHas('tags', function ($q) use ($tagIds) {
                $q->whereIn('customer_tags.id', $tagIds);
            });
        }

        if (!empty($criteria['search'])) {
            $s = $criteria['search'];
            $query->where(function ($q) use ($s) {
                $q->where('full_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%")
                  ->orWhere('customer_company_name', 'like', "%$s%");
            });
        }

        // Only customers with email
        $query->whereNotNull('email')->where('email', '!=', '');

        return $query;
    }

    public function createCampaign(array $data, $userId)
    {
        return DB::transaction(function () use ($data, $userId) {
            $data['campaign_code'] = $this->generateCode();
            $data['created_by'] = $userId;
            $data['status'] = 'draft';
            
            // $data['audience_snapshot'] should contain the criteria
            $criteria = $data['audience_snapshot'] ?? [];
            
            $campaign = CrmEmailCampaign::create($data);
            
            // Populate recipients
            $query = $this->buildAudienceQuery($criteria);
            
            // Use cursor for memory efficiency if large
            // But chunk is fine
            $query->chunk(500, function ($customers) use ($campaign) {
                $inserts = [];
                foreach ($customers as $customer) {
                    $inserts[] = [
                        'campaign_id' => $campaign->id,
                        'customer_id' => $customer->id,
                        'email' => $customer->email,
                        'status' => 'queued',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($inserts)) {
                    CrmEmailCampaignRecipient::insert($inserts);
                }
            });
            
            // Initialize totals? 
            // We do it in job, but good to have target count now
            // But count might change if we do it here vs job? 
            // The recipients are inserted here, so target is fixed here.
            $count = CrmEmailCampaignRecipient::where('campaign_id', $campaign->id)->count();
            $campaign->update(['totals' => [
                'target' => $count,
                'sent' => 0, 
                'failed' => 0, 
                'skipped' => 0
            ]]);

            return $campaign;
        });
    }

    public function sendCampaign($id)
    {
        $campaign = CrmEmailCampaign::findOrFail($id);
        
        if ($campaign->status !== 'draft') {
            throw new \Exception("Campaign must be in draft to send. Current status: " . $campaign->status);
        }

        $campaign->update(['status' => 'queued', 'queued_at' => now()]);
        
        // Lock template
        if ($campaign->template) {
            $campaign->template->update(['status' => 'locked', 'locked_at' => now()]);
        }

        SendCampaignJob::dispatch($id);

        return $campaign;
    }

    private function generateCode()
    {
        $prefix = 'ECAM-' . date('Ym') . '-';
        $last = CrmEmailCampaign::where('campaign_code', 'like', $prefix . '%')->orderBy('id', 'desc')->first();
        $num = $last ? intval(substr($last->campaign_code, -5)) + 1 : 1;
        return $prefix . str_pad($num, 5, '0', STR_PAD_LEFT);
    }
}
