const EmailService = require('./emailService');
const RegisterBot = require('./registerBot');
const fs = require('fs');
const path = require('path');

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
    const results = { success: 0, failed: 0 };
    let completedCount = 0;
    let startedCount = 0;

    const worker = async () => {
        while (startedCount < count) {
            if (signal?.aborted) return;

            const index = startedCount++;
            if (logCallback) logCallback(`\n--- Starting Account ${index + 1}/${count} ---`);

            const userData = {
                name: `User Bot ${Math.floor(Math.random() * 1000)}`,
                password: `Pass${Math.random().toString(36).substring(2, 10)}!`,
            };

            const success = await registerOneAccount(config, userData, logCallback, config.proxy);

            if (success) results.success++;
            else results.failed++;

            completedCount++;

            if (signal?.aborted) return;

            if (startedCount < count && index < count - 1) {
                // Sequential delay within one worker if we want to be safe, 
                // but if we have concurrency we might skip this or reduce it.
                // For now, keep a small 5s delay between starts in the SAME worker
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
        targetUrl: 'https://forgeon.io/register',
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
