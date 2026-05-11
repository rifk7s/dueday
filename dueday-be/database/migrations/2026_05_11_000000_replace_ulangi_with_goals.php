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
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the ulangi column
            $table->dropColumn('ulangi');
            
            // Add new goals columns
            $table->text('goals')->nullable()->after('deskripsi');
            $table->json('goal_points')->nullable()->after('goals');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Drop the new columns
            $table->dropColumn(['goals', 'goal_points']);
            
            // Re-add ulangi column
            $table->enum('ulangi', ['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun'])->nullable()->after('deskripsi');
        });
    }
};
