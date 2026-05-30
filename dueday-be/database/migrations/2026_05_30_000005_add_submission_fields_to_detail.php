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
        Schema::table('detail', function (Blueprint $table) {
            $table->longText('submission_text')->nullable()->after('file_name');
            $table->string('submission_file_path')->nullable()->after('submission_text');
            $table->timestamp('submitted_at')->nullable()->after('submission_file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detail', function (Blueprint $table) {
            $table->dropColumn(['submission_text', 'submission_file_path', 'submitted_at']);
        });
    }
};