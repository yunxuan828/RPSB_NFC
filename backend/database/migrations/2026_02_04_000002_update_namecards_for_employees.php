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
        Schema::table('customer_namecards', function (Blueprint $table) {
            // Drop foreign key first if it exists to modify the column
            // We need to check if we can modify it directly or need to drop constraint.
            // SQLite/MySQL differences apply, but usually for modifying nullable we just change it.
            // However, `created_by` has a constraint.
            
            // Allow created_by to be nullable (for when employees scan)
            $table->unsignedBigInteger('created_by')->nullable()->change();
            
            // Add collected_by_employee_id
            $table->foreignId('collected_by_employee_id')->nullable()->constrained('employees')->nullOnDelete()->after('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_namecards', function (Blueprint $table) {
            $table->dropForeign(['collected_by_employee_id']);
            $table->dropColumn('collected_by_employee_id');
            
            // Reverting nullable change might be risky if we have nulls, but for strict down:
            // $table->unsignedBigInteger('created_by')->nullable(false)->change();
        });
    }
};
