const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;

// Path to winery data
const DATA_FILE = path.join(__dirname, '../../data/wineries/wineries.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all wineries
app.get('/api/wineries', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read winery data', details: error.message });
    }
});

// UPDATE a winery
app.put('/api/wineries/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

        if (index < 0 || index >= data.wineries.length) {
            return res.status(404).json({ error: 'Winery not found' });
        }

        data.wineries[index] = { ...data.wineries[index], ...req.body, lastModified: new Date().toISOString() };
        data.metadata.lastUpdated = new Date().toISOString();

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, winery: data.wineries[index] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update winery', details: error.message });
    }
});

// ADD a new winery
app.post('/api/wineries', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

        const newWinery = {
            name: req.body.name || 'New Winery',
            originalSearchName: req.body.name || 'New Winery',
            address: req.body.address || null,
            coordinates: req.body.coordinates || null,
            phone: req.body.phone || null,
            website: req.body.website || null,
            hours: req.body.hours || null,
            googleRating: req.body.googleRating || null,
            reviewCount: req.body.reviewCount || null,
            placeId: req.body.placeId || null,
            googleMapsUrl: req.body.googleMapsUrl || null,
            businessStatus: req.body.businessStatus || null,
            verificationStatus: 'manually_verified',
            notes: req.body.notes || null,
            collectedAt: new Date().toISOString(),
            ...req.body
        };

        data.wineries.push(newWinery);
        data.metadata.totalWineries = data.wineries.length;
        data.metadata.lastUpdated = new Date().toISOString();

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, winery: newWinery, index: data.wineries.length - 1 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add winery', details: error.message });
    }
});

// DELETE a winery
app.delete('/api/wineries/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

        if (index < 0 || index >= data.wineries.length) {
            return res.status(404).json({ error: 'Winery not found' });
        }

        const deleted = data.wineries.splice(index, 1);
        data.metadata.totalWineries = data.wineries.length;
        data.metadata.lastUpdated = new Date().toISOString();

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, deleted: deleted[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete winery', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║           FLXguide Winery Manager                        ║
╠══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}              ║
║  Data file: ${DATA_FILE}  ║
╚══════════════════════════════════════════════════════════╝
    `);
});
