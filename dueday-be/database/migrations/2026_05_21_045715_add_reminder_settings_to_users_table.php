<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('reminder_task_time', 5)->nullable();
            $table->text('reminder_task_message')->nullable();
            $table->string('reminder_task_style')->nullable();
            $table->string('reminder_task_sound')->nullable();
            $table->boolean('reminder_task_vibrate')->default(false);

            $table->string('reminder_activity_time', 5)->nullable();
            $table->text('reminder_activity_message')->nullable();
            $table->string('reminder_activity_style')->nullable();
            $table->string('reminder_activity_sound')->nullable();
            $table->boolean('reminder_activity_vibrate')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'reminder_task_time',
                'reminder_task_message',
                'reminder_task_style',
                'reminder_task_sound',
                'reminder_task_vibrate',
                'reminder_activity_time',
                'reminder_activity_message',
                'reminder_activity_style',
                'reminder_activity_sound',
                'reminder_activity_vibrate',
            ]);
        });
    }
};
