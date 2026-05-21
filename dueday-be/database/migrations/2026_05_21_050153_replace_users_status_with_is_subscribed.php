<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_subscribed')->default(false)->after('nim');
        });

        DB::table('users')
            ->where('status', 'subscribed')
            ->update(['is_subscribed' => true]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('status', ['subscribed', 'unsubscribed'])->default('unsubscribed')->after('nim');
        });

        DB::table('users')
            ->where('is_subscribed', true)
            ->update(['status' => 'subscribed']);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_subscribed');
        });
    }
};
