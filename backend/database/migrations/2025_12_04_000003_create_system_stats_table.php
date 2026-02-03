<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_stats', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'total_cards_written'
            $table->integer('value')->default(0);
            $table->timestamps();
        });
        
        // Seed initial value
        DB::table('system_stats')->insert(['key' => 'total_cards_written', 'value' => 142]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_stats');
    }
};