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

File `.env.local` opsional. API URL ke-detect otomatis (lihat bagian API URL). Isi file ini hanya kalau mau pakai mock auth atau override khusus.

## Running

### Jalankan backend

```bash
cd dueday-be
composer run dev
```

Script `dev` menjalankan `php artisan serve --host=0.0.0.0 --port=8000` (plus queue, logs, dan Vite), jadi backend langsung bisa diakses dari Android emulator dan device fisik di jaringan yang sama tanpa setup tambahan.

Output yang benar di panel `server`:

```
INFO  Server running on [http://0.0.0.0:8000].
```

> [!NOTE]
> `--host=0.0.0.0` membuat dev server terlihat oleh perangkat lain di jaringan Wi-Fi yang sama. Jalankan di jaringan yang tepercaya.

### Jalankan frontend

```bash
cd dueday-fe
npm run start
```

Lalu tekan `a` untuk Android, `i` untuk iOS, atau scan QR code dengan Expo Go di device fisik (HP harus di jaringan Wi-Fi yang sama dengan komputer host).

## API URL

API URL ke-resolve otomatis, tidak perlu set manual:

| Target run | API URL hasil |
|------------|---------------|
| iOS simulator (macOS) | `http://localhost:8000/api` |
| Android emulator (AVD) | `http://10.0.2.2:8000/api` |
| Physical device via Expo Go (iOS/Android) | `http://<IP-LAN-host>:8000/api` |

Untuk device fisik, app membaca IP komputer host dari QR code yang di-scan, jadi cukup pastikan HP dan komputer host di jaringan Wi-Fi yang sama. IP yang berubah saat pindah jaringan tidak masalah karena ke-detect ulang setiap scan.

> [!NOTE]
> Android emulator menjalankan VM terpisah, jadi `localhost` di sana menunjuk ke emulator itu sendiri, bukan ke komputer host. Alias `10.0.2.2` adalah alamat khusus emulator yang me-route ke `127.0.0.1` host. Ini sudah ditangani otomatis.

> [!TIP]
> Set `EXPO_PUBLIC_API_URL` di `dueday-fe/.env.local` hanya untuk setup non-standar: `expo start --tunnel`, backend di mesin lain, atau API staging. Contoh: `http://192.168.x.x:8000/api`. Setelah mengubah `.env.local`, restart dengan `npx expo start --clear` supaya env baru ke-pickup.


## Mock Auth

Untuk dev tanpa backend, set di `dueday-fe/.env.local`:

```
EXPO_PUBLIC_MOCK_AUTH=true
```

Frontend akan skip real login dan menggunakan seed data lokal.


## Troubleshooting

### `Network request failed` di Android emulator

1. Pastikan backend jalan via `composer run dev` (listen di `0.0.0.0`).
2. Restart Expo dengan `npx expo start --clear`.

### `Network request failed` di device fisik

1. Pastikan komputer host dan device terhubung ke jaringan Wi-Fi yang sama.
2. Pastikan backend jalan via `composer run dev` (listen di `0.0.0.0`).
3. Pastikan firewall tidak memblokir port 8000:
   - macOS: System Settings > Network > Firewall, izinkan `php`.
   - Windows: Windows Defender Firewall > Allow an app, izinkan `php.exe` di Private network. Pastikan profil jaringan Wi-Fi di-set ke Private, bukan Public.
4. Cek IP LAN host kalau masih gagal:
   - macOS: `ipconfig getifaddr en0`
   - Windows (PowerShell): `ipconfig`, cari `IPv4 Address` di adapter Wi-Fi atau Ethernet aktif
5. Kalau jaringan punya client isolation (umum di Wi-Fi kampus atau kantor), pakai `EXPO_PUBLIC_API_URL` dengan tunnel (ngrok atau cloudflared) ke port 8000.

### `php` atau `composer` tidak dikenali di Windows

Pastikan PHP dan Composer ada di `PATH`. Restart terminal setelah instalasi. Cek dengan:

```powershell
php --version
composer --version
```
