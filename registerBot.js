const { chromium } = require('playwright');

class RegisterBot {
    constructor(config) {
        this.config = config; // Contains targetUrl, selectors, etc.
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async init() {
        const launchOptions = {
            headless: false,
            args: ['--disable-blink-features=AutomationControlled']
        };

        if (this.config.proxy) {
            launchOptions.proxy = {
                server: this.config.proxy.server, // e.g. http://myproxy.com:3128
                username: this.config.proxy.username,
                password: this.config.proxy.password
            };
        }

        this.browser = await chromium.launch(launchOptions);

        // Basic Stealth: Randomize User Agent and Viewport
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

        this.context = await this.browser.newContext({
            userAgent: randomUA,
            viewport: { width: 1280 + Math.floor(Math.random() * 100), height: 720 + Math.floor(Math.random() * 100) },
            deviceScaleFactor: 1,
            locale: 'en-US'
        });

        this.page = await this.context.newPage();

        // Remove webdriver property
        await this.page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
    }

    async register(userData) {
        try {
            console.log(`Navigating to ${this.config.targetUrl}...`);
            await this.page.goto(this.config.targetUrl);

            // This is a generic implementation. Selectors should be updated based on the website.
            console.log('Filling registration form...');

            if (this.config.selectors.name) {
                await this.page.fill(this.config.selectors.name, userData.name);
            }

            await this.page.fill(this.config.selectors.email, userData.email);
            await this.page.fill(this.config.selectors.password, userData.password);

            // Click submit
            await this.page.click(this.config.selectors.submit);

            console.log('Form submitted. Waiting for next step...');
            await this.page.waitForLoadState('networkidle');

            return true;
        } catch (error) {
            console.error('Registration failed:', error.message);
            throw error;
        }
    }

    async verifyCode(codeSelector, submitSelector, code) {
        try {
            console.log(`Entering verification code: ${code}`);
            await this.page.fill(codeSelector, code);
            await this.page.click(submitSelector);
            await this.page.waitForLoadState('networkidle');
            return true;
        } catch (error) {
            console.error('Verification failed:', error.message);
            throw error;
        }
    }

    async solveCaptcha(captchaType, apiKey) {
        try {
            console.log(`Attempting to solve ${captchaType} captcha...`);
            // This is a placeholder for integration with 2Captcha/Anti-Captcha
            // In a real scenario, we would use axios to send the captcha image/sitekey
            await new Promise(resolve => setTimeout(resolve, 2000));
            return "MOCK_CAPTCHA_TOKEN";
        } catch (error) {
            console.error('Captcha solving failed:', error.message);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = RegisterBot;
