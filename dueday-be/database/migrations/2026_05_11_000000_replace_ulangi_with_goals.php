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
            if (Schema::hasColumn('tasks', 'ulangi')) {
                $table->dropColumn('ulangi');
            }

            if (! Schema::hasColumn('tasks', 'goals')) {
                $table->text('goals')->nullable();
            }

            if (! Schema::hasColumn('tasks', 'goal_points')) {
                $table->json('goal_points')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'goals')) {
                $table->dropColumn('goals');
            }

            if (Schema::hasColumn('tasks', 'goal_points')) {
                $table->dropColumn('goal_points');
            }

            if (! Schema::hasColumn('tasks', 'ulangi')) {
                $table->enum('ulangi', ['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun'])->nullable();
            }
        });
    }
};
