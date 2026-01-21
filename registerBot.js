const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

class RegisterBot {
    constructor(config) {
        this.config = config;
        this.browser = null;
        this.context = null;
        this.page = null;
        this.screenshotDir = path.join(__dirname, 'screenshots');

        // Ensure screenshot directory exists
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async init() {
        const headless = this.config.headless !== undefined ? this.config.headless : false;

        const launchOptions = {
            headless: headless,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox'
            ]
        };

        if (this.config.proxy && this.config.proxy.server) {
            launchOptions.proxy = {
                server: this.config.proxy.server,
                username: this.config.proxy.username,
                password: this.config.proxy.password
            };
        }

        // Multi-browser support
        const browserType = this.config.browserType || 'chromium';
        console.log(`Launching ${browserType} browser...`);

        switch (browserType) {
            case 'firefox':
                this.browser = await firefox.launch(launchOptions);
                break;
            case 'webkit':
                this.browser = await webkit.launch(launchOptions);
                break;
            default:
                this.browser = await chromium.launch(launchOptions);
        }

        // Enhanced Stealth: More realistic browser fingerprint
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        ];

        // Use custom user agent if provided, otherwise random
        const userAgent = this.config.customUserAgent || userAgents[Math.floor(Math.random() * userAgents.length)];
        console.log(`Using User-Agent: ${userAgent.substring(0, 50)}...`);

        this.context = await this.browser.newContext({
            userAgent: userAgent,
            viewport: { width: 1366 + Math.floor(Math.random() * 200), height: 768 + Math.floor(Math.random() * 150) },
            deviceScaleFactor: 1,
            locale: 'en-US',
            timezoneId: 'America/New_York',
            permissions: ['geolocation'],
            geolocation: { latitude: 40.7128, longitude: -74.0060 }
        });

        this.page = await this.context.newPage();

        // Advanced anti-detection scripts
        await this.page.addInitScript(() => {
            // Hide webdriver
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

            // Mock plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            // Mock languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });

            // Mock chrome runtime
            window.chrome = { runtime: {} };
        });
    }

    // Human-like typing with variable speed
    async humanType(selector, text) {
        await this.page.click(selector);
        for (const char of text) {
            await this.page.keyboard.type(char, { delay: 50 + Math.random() * 150 });
            if (Math.random() > 0.9) {
                await this.page.waitForTimeout(200 + Math.random() * 300);
            }
        }
    }

    // Random mouse movement
    async humanMove() {
        const x = 100 + Math.random() * 800;
        const y = 100 + Math.random() * 400;
        await this.page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 20) });
    }

    // Generate random WhatsApp number
    generateWhatsAppNumber() {
        const prefixes = ['0812', '0813', '0821', '0822', '0852', '0853', '0857', '0858'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        return prefix + suffix;
    }

    // Screenshot capture for debugging (with error safety)
    async captureScreenshot(stage) {
        try {
            if (!this.page || this.page.isClosed()) {
                console.log(`Cannot capture screenshot: page is closed`);
                return null;
            }
            const timestamp = Date.now();
            const filename = `${stage}_${timestamp}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            await this.page.screenshot({ path: filepath, fullPage: true });
            console.log(`Screenshot saved: ${filename}`);
            return filepath;
        } catch (error) {
            console.log(`Screenshot failed: ${error.message}`);
            return null;
        }
    }

    // Smart Form Auto-Detection
    async detectFormFields() {
        const detected = {
            email: null,
            password: null,
            name: null,
            submit: null
        };

        // Email detection heuristics
        const emailSelectors = [
            'input[type="email"]',
            'input[name*="email"]',
            'input[id*="email"]',
            'input[placeholder*="email" i]',
            'input[autocomplete="email"]'
        ];
        for (const sel of emailSelectors) {
            if (await this.page.locator(sel).count() > 0) {
                detected.email = sel;
                break;
            }
        }

        // Password detection heuristics
        const passSelectors = [
            'input[type="password"]',
            'input[name*="password"]',
            'input[id*="password"]',
            'input[placeholder*="password" i]'
        ];
        for (const sel of passSelectors) {
            if (await this.page.locator(sel).count() > 0) {
                detected.password = sel;
                break;
            }
        }

        // Name detection heuristics
        const nameSelectors = [
            'input[name="name"]',
            'input[id*="name"]',
            'input[placeholder*="name" i]',
            'input[autocomplete="name"]',
            'input[name*="username"]'
        ];
        for (const sel of nameSelectors) {
            if (await this.page.locator(sel).count() > 0) {
                detected.name = sel;
                break;
            }
        }

        // Submit button detection
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Sign Up")',
            'button:has-text("Register")',
            'button:has-text("Create")',
            'button:has-text("Submit")'
        ];
        for (const sel of submitSelectors) {
            if (await this.page.locator(sel).count() > 0) {
                detected.submit = sel;
                break;
            }
        }

        console.log('Auto-detected fields:', detected);
        return detected;
    }

    // Test if selectors are valid
    async testSelectors(selectors) {
        const results = {};
        for (const [key, selector] of Object.entries(selectors)) {
            if (selector) {
                try {
                    const count = await this.page.locator(selector).count();
                    results[key] = { valid: count > 0, count };
                } catch (e) {
                    results[key] = { valid: false, error: e.message };
                }
            }
        }
        return results;
    }

    async register(userData) {
        try {
            console.log(`Navigating to ${this.config.targetUrl}...`);
            await this.page.goto(this.config.targetUrl, { waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(1000 + Math.random() * 1000);

            await this.captureScreenshot('01_page_loaded');

            // Use auto-detection if selectors are not provided or empty
            let selectors = this.config.selectors;
            if (this.config.autoDetect || !selectors.email) {
                console.log('Auto-detecting form fields...');
                const detected = await this.detectFormFields();
                selectors = { ...selectors, ...detected };
            }

            // Human-like interaction
            await this.humanMove();

            console.log('Filling registration form...');

            if (selectors.name) {
                await this.humanType(selectors.name, userData.name);
                await this.humanMove();
            }

            await this.humanType(selectors.email, userData.email);
            await this.humanMove();

            await this.humanType(selectors.password, userData.password);

            // Fill Confirm Password if selector provided
            if (selectors.confirmPassword) {
                await this.humanMove();
                console.log('Filling confirm password...');
                await this.humanType(selectors.confirmPassword, userData.password);
            }

            // Fill WhatsApp number if selector provided
            if (selectors.whatsapp) {
                await this.humanMove();
                const whatsappNumber = userData.whatsapp || this.generateWhatsAppNumber();
                console.log(`Filling WhatsApp: ${whatsappNumber}`);
                await this.humanType(selectors.whatsapp, whatsappNumber);
            }

            // Click Terms checkbox if selector provided
            if (selectors.terms) {
                await this.humanMove();
                console.log('Clicking terms checkbox...');
                await this.page.click(selectors.terms);
                await this.page.waitForTimeout(300);
            }

            await this.captureScreenshot('02_form_filled');

            // Small pause before submit
            await this.page.waitForTimeout(500 + Math.random() * 500);

            // Click submit
            await this.page.click(selectors.submit);

            console.log('Form submitted. Waiting for next step...');
            await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });

            await this.captureScreenshot('03_after_submit');

            return true;
        } catch (error) {
            await this.captureScreenshot('error_registration');
            console.error('Registration failed:', error.message);
            throw error;
        }
    }

    async verifyCode(codeSelector, submitSelector, code) {
        try {
            console.log(`Entering verification code: ${code}`);
            await this.humanType(codeSelector, code);
            await this.page.waitForTimeout(300);
            await this.page.click(submitSelector);
            await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
            await this.captureScreenshot('04_verified');
            return true;
        } catch (error) {
            await this.captureScreenshot('error_verification');
            console.error('Verification failed:', error.message);
            throw error;
        }
    }

    async solveCaptcha(captchaType, apiKey) {
        try {
            console.log(`Attempting to solve ${captchaType} captcha...`);
            await this.captureScreenshot('captcha_detected');
            // Placeholder for 2Captcha/Anti-Captcha integration
            await new Promise(resolve => setTimeout(resolve, 2000));
            return "MOCK_CAPTCHA_TOKEN";
        } catch (error) {
            console.error('Captcha solving failed:', error.message);
            throw error;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
                this.page = null;
                this.context = null;
            }
        } catch (error) {
            console.log(`Browser close error (ignored): ${error.message}`);
        }
    }
}

module.exports = RegisterBot;
