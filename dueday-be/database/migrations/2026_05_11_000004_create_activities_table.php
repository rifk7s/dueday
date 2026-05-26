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
        Schema::create('activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->unsignedBigInteger('tag_id')->nullable();
            $table->string('name');
            $table->date('date')->nullable();
            $table->date('anchor_date')->nullable(); 
            $table->time('time_start')->nullable();
            $table->time('time_end')->nullable();
            $table->enum('status', ['not_started', 'ongoing', 'pending', 'completed', 'cancelled'])->default('not_started');
            $table->integer('progress')->default(0);
            $table->text('description')->nullable();
            $table->enum('recurrence', ['daily','weekly','monthly','yearly'])->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('tag_id')->references('id')->on('tags')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};