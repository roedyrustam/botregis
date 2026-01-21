const EmailService = require('./emailService');
const RegisterBot = require('./registerBot');
const fs = require('fs');
const path = require('path');

// Realistic Indonesian Name Generator
const firstNames = [
    'Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Galih', 'Hendra',
    'Indra', 'Joko', 'Kusuma', 'Lestari', 'Mega', 'Nanda', 'Okta', 'Putri',
    'Rini', 'Sari', 'Teguh', 'Utami', 'Vina', 'Wahyu', 'Yusuf', 'Zahra',
    'Agus', 'Bambang', 'Cahya', 'Dimas', 'Endang', 'Fitri', 'Gunawan', 'Hani',
    'Irwan', 'Joni', 'Kartika', 'Lukman', 'Maya', 'Nurul', 'Omar', 'Putra',
    'Ratna', 'Surya', 'Tika', 'Udin', 'Vera', 'Wati', 'Yanto', 'Zaki'
];

const lastNames = [
    'Pratama', 'Wijaya', 'Santoso', 'Kusuma', 'Hidayat', 'Saputra', 'Nugroho',
    'Wibowo', 'Suryadi', 'Permana', 'Setiawan', 'Rahmawati', 'Susanto', 'Hartono',
    'Yulianto', 'Kurniawan', 'Suharto', 'Budiman', 'Hermawan', 'Prasetyo',
    'Wulandari', 'Purnama', 'Laksana', 'Mahendra', 'Adrianto', 'Firmansyah'
];

function generateRealisticName() {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstName} ${lastName}`;
}

async function saveAccount(account) {
    const filePath = path.join(__dirname, 'accounts.json');
    let accounts = [];
    if (fs.existsSync(filePath)) {
        try {
            accounts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error('Error parsing accounts.json, starting fresh.', e);
            accounts = []; // Ensure it's an array if corrupted
        }
    }
    accounts.push({ ...account, timestamp: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2));
    console.log(`Account saved to accounts.json: ${account.email}`);
}

async function registerOneAccount(config, userData, logCallback, proxy) {
    const emailService = new EmailService();
    // Merge proxy into bot config
    const botConfig = { ...config, proxy };
    const bot = new RegisterBot(botConfig);

    const log = (msg) => {
        console.log(msg);
        if (logCallback) logCallback(msg);
    };

    try {
        log(`Starting registration for ${userData.email || 'temporary email'}...`);

        // 1. Generate Email
        userData.email = await emailService.init();
        log(`Email generated: ${userData.email}`);

        // 2. Start Bot and Register
        await bot.init();
        log(`Navigating to ${config.targetUrl}...`);
        await bot.register(userData);

        // 3. Wait for Verification Email
        log('Waiting for verification email...');
        const verificationEmail = await emailService.waitForEmail((content) => {
            const lowText = content.text?.toLowerCase() || '';
            const lowSub = content.subject?.toLowerCase() || '';
            return lowSub.includes('verification') ||
                lowSub.includes('code') ||
                lowSub.includes('verify') ||
                lowText.includes('verification') ||
                lowText.includes('code') ||
                lowText.includes('verify');
        });

        log(`Verification email received: ${verificationEmail.subject}`);

        // 4. Extract Code (Configurable Pattern)
        let pattern;
        try {
            pattern = new RegExp(config.verificationPattern || '\\d{6}');
        } catch (e) {
            log(`Invalid regex pattern: ${config.verificationPattern}. Falling back to default.`);
            pattern = /\d{6}/;
        }
        const codeMatch = (verificationEmail.text || verificationEmail.html).match(pattern);
        if (codeMatch) {
            const code = codeMatch[0].match(/\d+/)?.[0] || codeMatch[0]; // Prefer digits if nested
            log(`Extracted code: ${code}`);

            // 5. Submit code
            await bot.verifyCode(config.selectors.verificationCode, config.selectors.verificationSubmit, code);

            // 6. Save success
            await saveAccount({ email: userData.email, password: userData.password });
            log('Registration and verification complete!');
            return true;
        } else {
            log('No 6-digit numeric code found in email. Check the extraction logic.');
            return false;
        }
    } catch (error) {
        log(`Registration failed: ${error.message}`);
        return false;
    } finally {
        await bot.close();
    }
}

async function batchRegister(config, count, logCallback, concurrency, signal) {
    const results = { success: 0, failed: 0, retried: 0 };
    let completedCount = 0;
    let startedCount = 0;
    const maxRetries = config.maxRetries || 2;

    const worker = async () => {
        while (startedCount < count) {
            if (signal?.aborted) return;

            const index = startedCount++;
            if (logCallback) logCallback(`\n--- Starting Account ${index + 1}/${count} ---`);

            const userData = {
                name: generateRealisticName(),
                password: `Pass${Math.random().toString(36).substring(2, 10)}!`,
            };

            let success = false;
            let attempts = 0;

            // Retry loop
            while (!success && attempts <= maxRetries) {
                if (attempts > 0) {
                    results.retried++;
                    if (logCallback) logCallback(`Retry ${attempts}/${maxRetries} for account ${index + 1}...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                success = await registerOneAccount(config, userData, logCallback, config.proxy);
                attempts++;

                if (signal?.aborted) return;
            }

            if (success) results.success++;
            else results.failed++;

            completedCount++;

            if (signal?.aborted) return;

            if (startedCount < count && index < count - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    };

    const workers = [];
    const actualConcurrency = Math.min(concurrency, count);
    for (let i = 0; i < actualConcurrency; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);
    return results;
}

async function main() {
    const accountCount = 1;

    const config = {
        targetUrl: 'https://example.com/register',
        selectors: {
            name: 'input[name="name"]',
            email: 'input[name="email"]',
            password: 'input[name="password"]',
            submit: 'button[type="submit"]',
            verificationCode: 'input[name="code"]',
            verificationSubmit: 'button#verify-btn'
        }
    };

    console.log(`Starting batch registration for ${accountCount} accounts...`);
    await batchRegister(config, accountCount, console.log);
}

module.exports = { batchRegister, registerOneAccount };

if (require.main === module) {
    main();
}
