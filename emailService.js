const axios = require('axios');

class EmailService {
    constructor() {
        this.baseUrl = 'https://api.mail.tm';
        this.token = null;
        this.address = null;
        this.password = null;
        this.accountId = null;
    }

    async requestWithRetry(fn, retries = 3, delay = 5000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (error.response?.status === 429 && i < retries - 1) {
                    console.warn(`Rate limited (429). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
    }

    async init() {
        try {
            // Get domains
            const domainsResponse = await this.requestWithRetry(() => axios.get(`${this.baseUrl}/domains`, { timeout: 15000 }));
            const domain = domainsResponse.data['hydra:member'][0].domain;

            // Generate random address and password
            const randomString = Math.random().toString(36).substring(2, 10);
            this.address = `${randomString}@${domain}`;
            this.password = 'Pass123!@#';

            // Create account
            await this.requestWithRetry(() => axios.post(`${this.baseUrl}/accounts`, {
                address: this.address,
                password: this.password
            }, { timeout: 15000 }));

            // Get token
            const tokenResponse = await this.requestWithRetry(() => axios.post(`${this.baseUrl}/token`, {
                address: this.address,
                password: this.password
            }, { timeout: 15000 }));
            this.token = tokenResponse.data.token;

            console.log(`Email created: ${this.address}`);
            return this.address;
        } catch (error) {
            console.error('Error initializing EmailService:', error.response?.data || error.message);
            throw error;
        }
    }

    async getMessages() {
        try {
            const response = await axios.get(`${this.baseUrl}/messages`, {
                headers: { Authorization: `Bearer ${this.token}` },
                timeout: 15000
            });
            return response.data['hydra:member'];
        } catch (error) {
            console.error('Error fetching messages:', error.response?.data || error.message);
            throw error;
        }
    }

    async getMessageContent(messageId) {
        try {
            const response = await axios.get(`${this.baseUrl}/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${this.token}` },
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching message content:', error.response?.data || error.message);
            throw error;
        }
    }

    async waitForEmail(filterFn, timeout = 60000, interval = 5000) {
        const startTime = Date.now();
        console.log('Waiting for verification email...');

        while (Date.now() - startTime < timeout) {
            const messages = await this.getMessages();
            for (const msg of messages) {
                const content = await this.getMessageContent(msg.id);
                if (filterFn(content)) {
                    return content;
                }
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('Email timeout: Verification email not received.');
    }
}

module.exports = EmailService;
