# BotRegis: Professional Registration Suite 🚀

BotRegis adalah suite otomatisasi registrasi high-performance berbasis Node.js. Aplikasi ini menggunakan Playwright untuk otomatisasi browser, Mail.tm untuk pengelolaan email sementara, dan Socket.io untuk pengalaman dashboard real-time yang premium.

## Fitur Unggulan

- ⚡ **High Performance**: Mendukung eksekusi paralel (Concurrency) untuk registrasi masal yang cepat.
- 🛡️ **Advanced Connectivity**: Dukungan penuh Proxy (HTTP/S) lengkap dengan autentikasi.
- 🎯 **Intelligent Extraction**: Gunakan Regex (Custom Patterns) untuk mengambil kode verifikasi dari berbagai format email.
- 🧩 **Configuration Presets**: Simpan dan muat konfigurasi target URL serta selektor dalam satu klik.
- 📊 **Real-time Statistics**: Monitor tingkat keberhasilan dan kegagalan secara langsung di dashboard.
- 🛑 **Graceful Stop**: Hentikan proses batch secara instan dengan satu tombol.
- 📂 **Data Export**: Ekspor hasil registrasi ke dalam format CSV yang rapi.
- 🕵️ **Stealth Mode**: Dilengkapi teknik bypass anti-bot dan dukungan Captcha solver hooks.

## Persiapan

- **Node.js**: Versi 16 atau lebih baru.
- **npm**: Terinstal bersama Node.js.

## Instalasi

1. Clone/salin folder proyek.
2. Buka terminal di direktori proyek:
   ```bash
   npm install
   ```
3. Instal browser dependencies:
   ```bash
   npx playwright install chromium
   ```

## Cara Menjalankan

1. Jalankan server dashboard:
   ```bash
   npm start
   ```
2. Buka browser dan akses: `http://localhost:3000`

## Panduan Penggunaan Dashboard

1. **Konfigurasi**: Masukkan target URL dan selektor CSS (Email, Password, Name, Submit, dll).
2. **Advanced Settings**:
   - Atur **Concurrency** (disarankan 1-3 untuk kestabilan).
   - Masukkan **Verification Pattern** jika format kode verifikasi berubah (default: 6 digit angka).
   - Tambahkan **Proxy** jika ingin menghindari blokir IP.
3. **Mulai**: Klik **Mulai Registrasi**. Monitor log di terminal visual dan cek statistik di header.
4. **Kelola**: Gunakan fitur **Presets** untuk menyimpan settingan agar tidak perlu mengisi ulang.
5. **Simpan**: Klik **Export to CSV** untuk mengunduh data akun yang terkumpul.

## Struktur Proyek

- `server.js`: API Server Express & Real-time communication.
- `index.js`: Orchestrator logika registrasi utama.
- `registerBot.js`: Logika interaksi browser (Playwright).
- `emailService.js`: Integrasi API Mail.tm untuk email sementara.
- `public/`: Interface web dashboard (HTML, CSS, JS).

## Troubleshooting & Tips

- **429 Rate Limit**: Jika terkena rate limit dari Mail.tm, aplikasi akan otomatis melakukan retry.
- **Selector Error**: Jika bot gagal mengisi form, periksa kembali selektor CSS menggunakan *Inspect Element* di browser target.
- **Reliability Audit**: Aplikasi ini telah diaudit untuk menangani error parsing JSON dan instabilitas jaringan secara otomatis.

## Lisensi
ISC
