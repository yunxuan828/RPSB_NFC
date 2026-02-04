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
        // 1. Add authentication fields to employees
        Schema::table('employees', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->rememberToken()->after('password');
            // 'role' can be useful later if employees have different permissions, default to standard
            $table->string('role')->default('standard')->after('status'); 
        });

        // 2. Add employee ownership to customers
        Schema::table('customers', function (Blueprint $table) {
            // nullable because customers might be created by Admins (created_by) OR Employees (collected_by_employee_id)
            $table->foreignId('collected_by_employee_id')->nullable()->constrained('employees')->nullOnDelete()->after('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['collected_by_employee_id']);
            $table->dropColumn('collected_by_employee_id');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['password', 'remember_token', 'role']);
        });
    }
};
