import express from 'express';
import Download from '../models/Download.js';

const router = express.Router();

// Get all downloads
router.get('/', async (req, res) => {
    try {
        const downloads = await Download.find().sort('-createdAt');
        res.json(downloads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get download by ID
router.get('/:id', async (req, res) => {
    try {
        const download = await Download.findById(req.params.id);
        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }
        res.json(download);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initiate download
router.post('/', async (req, res) => {
    try {
        const { url, quality, type } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const download = new Download({
            url,
            quality: quality || '1080p',
            type: type || 'video',
            status: 'pending'
        });

        await download.save();

        // TODO: Implement actual download logic with ytdl-core or similar
        // For now, just return the created download

        res.status(201).json(download);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pause download
router.post('/:id/pause', async (req, res) => {
    try {
        const download = await Download.findById(req.params.id);
        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        if (download.status !== 'downloading') {
            return res.status(400).json({ error: 'Download is not in progress' });
        }

        download.status = 'paused';
        await download.save();

        res.json(download);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resume download
router.post('/:id/resume', async (req, res) => {
    try {
        const download = await Download.findById(req.params.id);
        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        if (download.status !== 'paused') {
            return res.status(400).json({ error: 'Download is not paused' });
        }

        download.status = 'downloading';
        await download.save();

        res.json(download);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel download
router.delete('/:id', async (req, res) => {
    try {
        const download = await Download.findById(req.params.id);
        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        download.status = 'cancelled';
        await download.save();

        res.json({ message: 'Download cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
