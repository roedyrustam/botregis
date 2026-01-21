# BotRegis: Enterprise Registration Suite 🚀

Suite otomatisasi registrasi enterprise-grade dengan auto-detection, multi-browser, dan stealth mode.

## Fitur Unggulan

### 🧠 Smart Auto-Detection
Bot otomatis mendeteksi **7 field** tanpa input manual:
- Email, Password, Confirm Password
- Name/Username, WhatsApp/Phone
- Terms Checkbox, Submit Button

### 🌐 Multi-Browser Support
Pilih browser: Chromium, Firefox, atau WebKit

### 🕵️ Stealth Mode
Human-like typing, random mouse movements, fingerprint spoofing

### ⚡ Performance
- Parallel execution (concurrency)
- Auto-retry dengan max attempts
- Scheduled registrations

### 📦 Site Templates
8 template siap pakai: Generic, Discord, Twitter, T4JamTools, Orderan.id, Yotoko, BelajarKoding, dll

### 📣 Integrations
- Webhook notifications (Discord/Slack)
- CSV export
- Custom user agent

## Quick Start

```bash
npm install && npx playwright install chromium
npm start
```
Buka `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Deskripsi |
| :--- | :--- | :--- |
| `/api/start` | POST | Mulai batch |
| `/api/stop` | POST | Stop batch |
| `/api/accounts` | GET | Daftar akun |
| `/api/export` | GET | Download CSV |
| `/api/templates` | GET | Site templates |
| `/api/presets` | GET/POST | Manage presets |
| `/api/schedule` | POST | Jadwalkan job |
| `/api/test-selectors` | POST | Test selectors |
| `/api/stats` | GET | Statistik |

## Auto-Detection Fields

| Field | Selectors |
| :--- | :--- |
| Email | `input[type="email"]`, `input[name*="email"]` |
| Password | `input[type="password"]:first-of-type` |
| Confirm Pass | `input[name="password2"]`, `input[name="password_confirmation"]` |
| Name | `input[name="name"]`, `input[name*="username"]` |
| WhatsApp | `input[type="tel"]`, `input[name*="phone"]` |
| Terms | `input[type="checkbox"]` |
| Submit | `button[type="submit"]`, `button:has-text("Daftar")` |

## Struktur

```
botregis/
├── server.js           # Express API + Socket.io
├── index.js            # Registration orchestrator
├── registerBot.js      # Playwright automation
├── emailService.js     # Mail.tm integration
├── templates.json      # 8 site templates
└── public/             # Web dashboard
```

## Lisensi
ISC
