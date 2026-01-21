# BotRegis: Enterprise Registration Suite 🚀

Suite otomatisasi registrasi enterprise-grade berbasis Node.js dengan Playwright, Mail.tm, dan Socket.io.

## Fitur Unggulan

### Core Features
- ⚡ **Parallel Execution** - Concurrency control untuk registrasi masal
- 🛡️ **Proxy Support** - HTTP/S proxy dengan autentikasi
- 📊 **Real-time Stats** - Monitor success/failure di dashboard
- 📂 **CSV Export** - Ekspor akun terdaftar

### Intelligence
- 🧠 **Auto-Detect Fields** - Deteksi otomatis form email/password/name
- 🎯 **Custom Regex** - Pattern kustom untuk kode verifikasi
- 🔄 **Auto-Retry** - Retry otomatis dengan configurable max attempts
- 🕵️ **Stealth Mode** - Human-like typing, mouse movements, fingerprint spoofing

### Automation
- 📦 **Site Templates** - Template siap pakai (Discord, Twitter, Generic)
- 🧩 **Presets** - Simpan & muat konfigurasi
- ⏰ **Scheduling** - Jadwalkan registrasi untuk waktu tertentu
- 📸 **Screenshots** - Auto-capture setiap stage untuk debugging

## Quick Start

```bash
npm install && npx playwright install chromium
npm start
```
Buka `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/api/start` | POST | Mulai batch registrasi |
| `/api/stop` | POST | Stop batch |
| `/api/accounts` | GET | Daftar akun |
| `/api/export` | GET | Download CSV |
| `/api/templates` | GET | Site templates |
| `/api/presets` | GET/POST | Manage presets |
| `/api/schedule` | POST | Jadwalkan job |
| `/api/scheduled` | GET | Lihat scheduled jobs |
| `/api/test-selectors` | POST | Test validitas selectors |
| `/api/stats` | GET | Statistik sukses/gagal |

## Struktur Proyek

```
botregis/
├── server.js           # Express API + Socket.io
├── index.js            # Registration orchestrator
├── registerBot.js      # Playwright automation
├── emailService.js     # Mail.tm integration
├── templates.json      # Site templates
├── screenshots/        # Auto-captured screenshots
└── public/             # Web dashboard
```

## Troubleshooting

- **Selector Error**: Gunakan tombol "Test Selectors" sebelum running
- **Rate Limit**: Auto-retry sudah built-in
- **Debugging**: Cek folder `screenshots/` untuk visual log

## Lisensi
ISC
