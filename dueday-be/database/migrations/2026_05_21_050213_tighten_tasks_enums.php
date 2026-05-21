<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize existing rows so the new CHECK constraints don't reject them.
        DB::table('tasks')->whereNotIn('status', ['ongoing', 'completed', 'completed_late'])
            ->update(['status' => 'ongoing']);

        DB::table('tasks')->whereNotNull('source')
            ->whereNotIn('source', ['manual', 'elearn'])
            ->update(['source' => 'manual']);

        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['ongoing', 'completed', 'completed_late'])
                ->default('ongoing')
                ->change();
            $table->enum('source', ['manual', 'elearn'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status')->default('ongoing')->change();
            $table->string('source')->nullable()->change();
        });
    }
};
