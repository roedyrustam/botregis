const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { batchRegister } = require('./index');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let botRunning = false;
let botAbortController = null;
let stats = {
    total: 0,
    success: 0,
    failed: 0,
    history: []
};
let scheduledJobs = [];

// Template Endpoint
app.get('/api/templates', (req, res) => {
    const filePath = path.join(__dirname, 'templates.json');
    if (fs.existsSync(filePath)) {
        try {
            res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
        } catch (e) {
            res.json([]);
        }
    } else {
        res.json([]);
    }
});

// API Endpoints
app.get('/api/accounts', (req, res) => {
    const filePath = path.join(__dirname, 'accounts.json');
    if (fs.existsSync(filePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: 'Failed to read accounts data' });
        }
    } else {
        res.json([]);
    }
});

app.post('/api/start', async (req, res) => {
    if (botRunning) {
        return res.status(400).json({ error: 'Bot is already running' });
    }

    const { config, count, concurrency } = req.body;

    if (!config || !config.targetUrl) {
        return res.status(400).json({ error: 'Invalid configuration' });
    }

    botRunning = true;
    botAbortController = new AbortController();
    res.json({ message: 'Bot started' });

    io.emit('log', { message: `--- Starting Batch of ${count} (Concurrency: ${concurrency || 1}) ---`, type: 'info' });

    try {
        const batchResults = await batchRegister(config, count, (msg) => {
            io.emit('log', { message: msg, type: 'process' });
        }, concurrency || 1, botAbortController.signal);

        // Update stats
        stats.total += count;
        stats.success += batchResults.success;
        stats.failed += batchResults.failed;
        stats.history.push({
            timestamp: new Date().toISOString(),
            ...batchResults
        });
        if (stats.history.length > 10) stats.history.shift();
        io.emit('stats', stats);

        if (botAbortController.signal.aborted) {
            io.emit('log', { message: '--- Batch Stopped by User ---', type: 'error' });
        } else {
            io.emit('log', { message: '--- Batch Completed ---', type: 'success' });
        }
    } catch (error) {
        io.emit('log', { message: `Fatal Error: ${error.message}`, type: 'error' });
    } finally {
        botRunning = false;
        botAbortController = null;
        io.emit('status', { running: false });
    }
});

app.get('/api/stats', (req, res) => {
    res.json(stats);
});

// Selector Testing Endpoint
app.post('/api/test-selectors', async (req, res) => {
    const { targetUrl, selectors } = req.body;

    if (!targetUrl) {
        return res.status(400).json({ error: 'Target URL is required' });
    }

    const RegisterBot = require('./registerBot');
    const bot = new RegisterBot({ targetUrl, selectors, headless: true });

    try {
        await bot.init();
        await bot.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const results = await bot.testSelectors(selectors);
        const detected = await bot.detectFormFields();

        await bot.close();

        res.json({
            results,
            autoDetected: detected,
            message: 'Selector test completed'
        });
    } catch (error) {
        await bot.close().catch(() => { });
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stop', (req, res) => {
    if (botRunning && botAbortController) {
        botAbortController.abort();
        res.json({ message: 'Stopping bot...' });
    } else {
        res.status(400).json({ error: 'Bot is not running' });
    }
});

app.get('/api/export', (req, res) => {
    const filePath = path.join(__dirname, 'accounts.json');
    if (fs.existsSync(filePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data.length === 0) {
                return res.status(400).send('No data to export');
            }

            // Convert to CSV
            const headers = ['email', 'password', 'timestamp'];
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = headers.map(header => {
                    const val = row[header] || '';
                    return `"${val.toString().replace(/"/g, '""')}"`;
                });
                csvRows.push(values.join(','));
            }

            const csvContent = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=registered_accounts.csv');
            res.status(200).send(csvContent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to process export' });
        }
    } else {
        res.status(404).send('No accounts found');
    }
});

app.get('/api/presets', (req, res) => {
    const filePath = path.join(__dirname, 'presets.json');
    if (fs.existsSync(filePath)) {
        try {
            res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
        } catch (e) {
            res.status(500).json({ error: 'Failed to read presets data' });
        }
    } else {
        res.json([]);
    }
});

app.post('/api/presets', (req, res) => {
    const filePath = path.join(__dirname, 'presets.json');
    const newPreset = req.body;
    if (!newPreset.name || !newPreset.config) {
        return res.status(400).json({ error: 'Invalid preset data' });
    }

    let presets = [];
    if (fs.existsSync(filePath)) {
        try {
            presets = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            presets = [];
        }
    }

    // Update existing or add new
    const index = presets.findIndex(p => p.name === newPreset.name);
    if (index !== -1) {
        presets[index] = newPreset;
    } else {
        presets.push(newPreset);
    }

    fs.writeFileSync(filePath, JSON.stringify(presets, null, 2));
    res.json({ message: 'Preset saved' });
});

app.get('/api/status', (req, res) => {
    res.json({ running: botRunning, scheduledJobs: scheduledJobs.length });
});

// Schedule Registration
app.post('/api/schedule', (req, res) => {
    const { config, count, concurrency, scheduledTime } = req.body;

    if (!scheduledTime) {
        return res.status(400).json({ error: 'Scheduled time is required' });
    }

    const executeTime = new Date(scheduledTime).getTime();
    const now = Date.now();

    if (executeTime <= now) {
        return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const delay = executeTime - now;
    const jobId = Date.now().toString();

    const job = {
        id: jobId,
        config,
        count,
        concurrency,
        scheduledTime,
        status: 'pending'
    };

    scheduledJobs.push(job);

    setTimeout(async () => {
        const jobIndex = scheduledJobs.findIndex(j => j.id === jobId);
        if (jobIndex === -1) return; // Job was cancelled

        scheduledJobs[jobIndex].status = 'running';
        io.emit('log', { message: `--- Scheduled Job ${jobId} Starting ---`, type: 'info' });

        botRunning = true;
        botAbortController = new AbortController();
        io.emit('status', { running: true });

        try {
            await batchRegister(config, count, (msg) => {
                io.emit('log', { message: msg, type: 'process' });
            }, concurrency || 1, botAbortController.signal);

            scheduledJobs[jobIndex].status = 'completed';
            io.emit('log', { message: `--- Scheduled Job ${jobId} Completed ---`, type: 'success' });
        } catch (error) {
            scheduledJobs[jobIndex].status = 'failed';
            io.emit('log', { message: `Scheduled Job Failed: ${error.message}`, type: 'error' });
        } finally {
            botRunning = false;
            botAbortController = null;
            io.emit('status', { running: false });
        }
    }, delay);

    res.json({ message: `Job scheduled for ${scheduledTime}`, jobId });
});

// Get Scheduled Jobs
app.get('/api/scheduled', (req, res) => {
    res.json(scheduledJobs);
});

// Cancel Scheduled Job
app.delete('/api/schedule/:id', (req, res) => {
    const index = scheduledJobs.findIndex(j => j.id === req.params.id);
    if (index !== -1 && scheduledJobs[index].status === 'pending') {
        scheduledJobs.splice(index, 1);
        res.json({ message: 'Job cancelled' });
    } else {
        res.status(404).json({ error: 'Job not found or already running' });
    }
});

// Socket logic
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('status', { running: botRunning });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
