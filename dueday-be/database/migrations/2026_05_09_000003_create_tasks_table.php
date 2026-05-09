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
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->integer('id_tag')->nullable();
            $table->string('task_name');
            $table->date('date')->nullable();
            $table->time('time')->nullable();
            $table->string('priority')->nullable();
            $table->enum('status', ['ongoing', 'completed'])->default('ongoing');
            $table->string('source')->nullable();
            $table->text('deskripsi')->nullable();
            $table->integer('progress')->default(0);
            $table->enum('ulangi', ['setiap_hari', 'satu_minggu', 'satu_bulan', 'satu_tahun'])->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('id_tag')->references('id_tag')->on('tags')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
