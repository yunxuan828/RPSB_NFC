<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('card_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable(); // ID of the user whose card was written (e.g. 101)
            $table->string('description')->nullable(); // "Card written for John Doe"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_activity_logs');
    }
};
