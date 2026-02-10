<?php

namespace App\Jobs;

use App\Models\CrmEmailCampaignRecipient;
use App\Models\CustomerActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendRecipientEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $recipientId;

    /**
     * Create a new job instance.
     */
    public function __construct($recipientId)
    {
        $this->recipientId = $recipientId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $recipient = CrmEmailCampaignRecipient::with(['campaign.template', 'customer'])->find($this->recipientId);

        if (!$recipient || !$recipient->campaign) {
            return;
        }

        // Double check campaign status
        if ($recipient->campaign->status === 'cancelled') {
            $recipient->update(['status' => 'skipped', 'error_message' => 'Campaign cancelled']);
            $this->incrementTotal($recipient->campaign_id, 'skipped');
            return;
        }

        $customer = $recipient->customer;
        $template = $recipient->campaign->template;
        
        // Use snapshot email from recipient record, or fallback to customer email
        $email = $recipient->email ?? $customer->email;

        if (!$email) {
            $recipient->update(['status' => 'failed', 'error_message' => 'No email address']);
            $this->incrementTotal($recipient->campaign_id, 'failed');
            return;
        }

        try {
            // Replace variables
            $body = $this->replaceVariables($template->body_html, $customer);
            $subject = $this->replaceVariables($template->subject, $customer);

            Mail::html($body, function ($message) use ($email, $subject, $recipient) {
                $message->to($email)
                        ->subject($subject);
                
                // Track message ID if possible (depends on driver)
                // $recipient->message_id = ...
            });

            $recipient->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            $this->incrementTotal($recipient->campaign_id, 'sent');

            // Log Activity
            CustomerActivity::create([
                'customer_id' => $customer->id,
                'type' => 'email_sent',
                'title' => 'Email Campaign: ' . $template->name,
                'payload' => [
                    'campaign_id' => $recipient->campaign_id,
                    'template_id' => $template->id,
                    'subject' => $subject,
                    'sent_at' => now()->toIso8601String(),
                    'recipient_email' => $email
                ],
                'created_by' => $recipient->campaign->created_by, // Or system
            ]);

        } catch (\Exception $e) {
            $recipient->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
            $this->incrementTotal($recipient->campaign_id, 'failed');
        }
    }

    protected function replaceVariables($content, $customer)
    {
        // Simple {{customer.full_name}} replacement
        // Only allow customer.* for now
        
        return preg_replace_callback('/\{\{\s*customer\.(\w+)\s*\}\}/', function ($matches) use ($customer) {
            $field = $matches[1];
            return $customer->$field ?? '';
        }, $content);
    }

    protected function incrementTotal($campaignId, $key)
    {
        // Use raw update for atomicity
        // JSON_SET(totals, '$.sent', JSON_EXTRACT(totals, '$.sent') + 1)
        // Adjust for MariaDB/MySQL differences if needed, but this is standard MySQL
        
        DB::statement("UPDATE crm_email_campaigns SET totals = JSON_SET(totals, '$.$key', JSON_EXTRACT(totals, '$.$key') + 1) WHERE id = ?", [$campaignId]);
    }
}
