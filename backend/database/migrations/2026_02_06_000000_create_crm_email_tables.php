<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('crm_email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('template_code')->unique(); // "ET-202602-00001"
            $table->string('name');
            $table->string('subject');
            $table->longText('body_html');
            $table->longText('body_text')->nullable();
            $table->json('variables')->nullable();
            $table->enum('status', ['draft', 'locked'])->default('draft');
            $table->dateTime('locked_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('crm_email_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('campaign_code')->unique(); // "ECAM-202602-00001"
            $table->foreignId('template_id')->constrained('crm_email_templates')->restrictOnDelete();
            $table->string('name');
            $table->json('audience_snapshot'); // snapshot of selection criteria + counts
            $table->enum('status', ['draft', 'queued', 'sending', 'completed', 'failed', 'cancelled'])->default('draft');
            $table->dateTime('queued_at')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->json('totals')->nullable(); // {target: 120, sent: 0, failed:0, skipped:0}
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('crm_email_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('crm_email_campaigns')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('email');
            $table->enum('status', ['queued', 'sent', 'failed', 'skipped'])->default('queued');
            $table->text('error_message')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->string('message_id')->nullable();
            $table->timestamps();

            $table->unique(['campaign_id', 'customer_id']);
        });

        // Update customer_activities type enum to include 'email_sent'
        // We will modify the column to be a string to be more flexible, or just extend the enum.
        // Extending enum in MySQL requires raw statement.
        // To be safe and minimal, let's try to convert to string if it's not too disruptive, 
        // but given the "do minimal" instruction and existing data, extending enum is safer if we know the current values.
        
        $types = [
            'created',
            'updated',
            'status_changed',
            'comment',
            'attachment_added',
            'attachment_deleted',
            'event_created',
            'event_updated',
            'event_deleted',
            'email_sent' // Added
        ];
        
        $enumStr = "'" . implode("','", $types) . "'";
        
        DB::statement("ALTER TABLE customer_activities MODIFY COLUMN type ENUM($enumStr) DEFAULT 'created'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_email_campaign_recipients');
        Schema::dropIfExists('crm_email_campaigns');
        Schema::dropIfExists('crm_email_templates');

        // Revert enum (remove email_sent)
        $types = [
            'created',
            'updated',
            'status_changed',
            'comment',
            'attachment_added',
            'attachment_deleted',
            'event_created',
            'event_updated',
            'event_deleted'
        ];
        $enumStr = "'" . implode("','", $types) . "'";
        
        // We need to handle cases where 'email_sent' might exist if we revert. 
        // Usually down() should clean up data or fail. 
        // Here we just revert the definition. If there are 'email_sent' rows, this might fail or truncate.
        // For safety in dev, we'll try to revert definition.
        
        DB::statement("ALTER TABLE customer_activities MODIFY COLUMN type ENUM($enumStr) DEFAULT 'created'");
    }
};
