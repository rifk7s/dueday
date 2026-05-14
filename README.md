# DueDay

[![React Doctor](https://www.react.doctor/share/badge?p=dueday-fe&s=93&e=4&w=15&f=3)](https://www.react.doctor/share?p=dueday-fe&s=93&e=4&w=15&f=3)

Laravel REST API backend + Expo (iOS/Android/Web) frontend.

## Stack

| Folder | Stack |
|--------|-------|
| `dueday-be/` | Laravel 13, PHP 8.4, Pest, SQLite |
| `dueday-fe/` | Expo SDK 54, React 19, TypeScript, NativeWind v5 |

## Prerequisites

- PHP 8.4, Composer
- Node 22+, npm
- Untuk Android: Android Studio + AVD emulator
- Untuk iOS: Xcode + iOS Simulator (macOS only)

## Setup

### 1. Backend (`dueday-be`)

macOS / Linux:

```bash
cd dueday-be
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Windows (PowerShell):

```powershell
cd dueday-be
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate --seed
```

### 2. Frontend (`dueday-fe`)

macOS / Linux:

```bash
cd dueday-fe
npm install
cp .env.local.example .env.local
```

Windows (PowerShell):

```powershell
cd dueday-fe
npm install
Copy-Item .env.local.example .env.local
```

Edit `.env.local` dan set `EXPO_PUBLIC_API_URL` sesuai target run (lihat tabel di bawah).

## Running

### Jalankan backend

Untuk akses dari Android emulator atau device fisik, backend harus listen di `0.0.0.0`, bukan default `127.0.0.1`.

```bash
cd dueday-be
php artisan serve --host=0.0.0.0 --port=8000
```

Output yang benar:

```
INFO  Server running on [http://0.0.0.0:8000].
```

> [!WARNING]
> `composer run dev` saat ini menjalankan `php artisan serve` tanpa `--host=0.0.0.0`, sehingga server hanya listen di `127.0.0.1`. Android emulator dan device fisik tidak bisa connect. Gunakan command manual di atas sampai script `dev` di-update.

### Jalankan frontend

```bash
cd dueday-fe
npm run start
```

Lalu tekan `a` untuk Android, `i` untuk iOS, atau scan QR code dengan Expo Go di device fisik.

## Konfigurasi API URL

Set `EXPO_PUBLIC_API_URL` di `dueday-fe/.env.local` sesuai target:

| Target run | API URL |
|------------|---------|
| iOS simulator (macOS) | `http://localhost:8000/api` |
| Android emulator (AVD) | `http://10.0.2.2:8000/api` |
| Physical device (iOS/Android) | `http://<IP-LAN-host>:8000/api` |

> [!NOTE]
> Android emulator menjalankan VM terpisah, jadi `localhost` di sana menunjuk ke emulator itu sendiri, bukan ke komputer host. Alias `10.0.2.2` adalah alamat khusus Android emulator yang me-route ke `127.0.0.1` host.

> [!TIP]
> Cek IP LAN komputer host:
>
> - macOS: `ipconfig getifaddr en0`
> - Windows (PowerShell): `ipconfig` lalu cari `IPv4 Address` di adapter Wi-Fi atau Ethernet aktif
>
> IP ini bisa berubah saat pindah jaringan, jadi update `.env.local` kalau koneksi tiba-tiba gagal di device fisik.

> [!IMPORTANT]
> Setiap kali mengubah `.env.local`, restart Expo dengan cache clear supaya env baru ke-pickup:
>
> ```bash
> npx expo start --clear
> ```


## Mock Auth

Untuk dev tanpa backend, set di `dueday-fe/.env.local`:

```
EXPO_PUBLIC_MOCK_AUTH=true
```

Frontend akan skip real login dan menggunakan seed data lokal.


## Troubleshooting

### `Network request failed` di Android emulator

1. Pastikan `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` di `.env.local`.
2. Pastikan backend listen di `0.0.0.0`, bukan `127.0.0.1`.
3. Restart Expo dengan `npx expo start --clear`.

### `Network request failed` di device fisik

1. Pastikan komputer host dan device terhubung ke jaringan Wi-Fi yang sama.
2. Set `EXPO_PUBLIC_API_URL` ke IP LAN host (`http://192.168.x.x:8000/api`).
3. Pastikan firewall tidak memblokir port 8000:
   - macOS: System Settings > Network > Firewall, izinkan `php`.
   - Windows: Windows Defender Firewall > Allow an app, izinkan `php.exe` di Private network.
4. Pastikan backend listen di `0.0.0.0`.

### `php` atau `composer` tidak dikenali di Windows

Pastikan PHP dan Composer ada di `PATH`. Restart terminal setelah instalasi. Cek dengan:

```powershell
php --version
composer --version
```
