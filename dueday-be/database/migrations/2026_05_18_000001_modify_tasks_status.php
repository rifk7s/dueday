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
        // Change the tasks.status column to a string so we can accept
        // additional lifecycle values like `completed_late` without
        // being constrained by the original enum.
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('status')->default('ongoing')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->enum('status', ['ongoing', 'completed'])->default('ongoing')->change();
        });
    }
};
