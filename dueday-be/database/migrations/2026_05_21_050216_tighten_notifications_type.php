<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('notifications')
            ->whereNotIn('type', ['reminder', 'system', 'payment', 'info'])
            ->update(['type' => 'info']);

        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('type', ['reminder', 'system', 'payment', 'info'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('type')->change();
        });
    }
};
