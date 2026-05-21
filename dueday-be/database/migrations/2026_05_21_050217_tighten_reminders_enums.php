<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('reminders')->orderBy('id')->each(function ($row) {
            $style = $this->normalizeStyle($row->gaya_pesan);
            $sound = $this->normalizeSound($row->suara_notifikasi);
            DB::table('reminders')->where('id', $row->id)->update([
                'gaya_pesan' => $style,
                'suara_notifikasi' => $sound,
            ]);
        });

        Schema::table('reminders', function (Blueprint $table) {
            $table->enum('gaya_pesan', ['tegas', 'ngancam_halus', 'santai'])
                ->nullable()
                ->change();
            $table->enum('suara_notifikasi', ['default', 'chime', 'bell'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->string('gaya_pesan')->nullable()->change();
            $table->string('suara_notifikasi')->nullable()->change();
        });
    }

    private function normalizeStyle(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = strtolower(str_replace(' ', '_', trim($value)));

        return match ($value) {
            'tegas' => 'tegas',
            'ngancam_halus' => 'ngancam_halus',
            'santai' => 'santai',
            default => null,
        };
    }

    private function normalizeSound(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = strtolower(trim($value));

        return in_array($value, ['default', 'chime', 'bell'], true) ? $value : null;
    }
};
