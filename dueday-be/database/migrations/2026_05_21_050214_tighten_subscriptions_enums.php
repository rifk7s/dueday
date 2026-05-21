<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Normalize free-form plan strings into the new enum.
        DB::table('subscriptions')->orderBy('id')->each(function ($row) {
            $plan = $this->normalizePlan($row->plan);
            DB::table('subscriptions')->where('id', $row->id)->update(['plan' => $plan]);
        });

        DB::table('subscriptions')
            ->whereNotIn('status', ['active', 'expired', 'cancelled', 'pending'])
            ->update(['status' => 'pending']);

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->enum('status', ['active', 'expired', 'cancelled', 'pending'])
                ->default('pending')
                ->change();
            $table->enum('plan', ['satu_bulan', 'tiga_bulan', 'satu_tahun'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('status')->change();
            $table->string('plan')->nullable()->change();
        });
    }

    private function normalizePlan(?string $plan): ?string
    {
        if ($plan === null) {
            return null;
        }

        $normalized = strtolower($plan);

        return match (true) {
            str_contains($normalized, '3 bulan') => 'tiga_bulan',
            str_contains($normalized, '1 tahun'), str_contains($normalized, 'tahun') => 'satu_tahun',
            str_contains($normalized, 'bulan') => 'satu_bulan',
            default => 'satu_bulan',
        };
    }
};
