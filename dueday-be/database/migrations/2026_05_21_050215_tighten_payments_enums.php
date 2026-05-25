<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payments')
            ->whereNotIn('status', ['pending', 'paid', 'failed'])
            ->update(['status' => 'pending']);

        DB::table('payments')
            ->whereNotNull('method')
            ->whereNotIn('method', ['qris', 'gopay', 'ovo', 'dana', 'bca', 'bri', 'mandiri'])
            ->update(['method' => null]);

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'paid', 'failed'])
                ->default('pending')
                ->change();
            $table->enum('method', ['qris', 'gopay', 'ovo', 'dana', 'bca', 'bri', 'mandiri'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status')->change();
            $table->string('method')->nullable()->change();
        });
    }
};
