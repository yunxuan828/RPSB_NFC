<?php

namespace App\Jobs;

use App\Models\CrmEmailCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $campaignId;

    /**
     * Create a new job instance.
     */
    public function __construct($campaignId)
    {
        $this->campaignId = $campaignId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $campaign = CrmEmailCampaign::find($this->campaignId);
        
        if (!$campaign || $campaign->status === 'cancelled') {
            return;
        }

        // Initialize totals
        $totalRecipients = $campaign->recipients()->count();
        $campaign->update([
            'status' => 'sending', 
            'started_at' => now(),
            'totals' => [
                'target' => $totalRecipients,
                'sent' => 0,
                'failed' => 0,
                'skipped' => 0
            ]
        ]);

        // Lock template (redundant safety)
        if ($campaign->template->status !== 'locked') {
            $campaign->template->update(['status' => 'locked', 'locked_at' => now()]);
        }

        $campaign->recipients()->where('status', 'queued')->chunk(100, function ($recipients) {
            foreach ($recipients as $recipient) {
                dispatch(new SendRecipientEmailJob($recipient->id));
            }
        });
    }
}
