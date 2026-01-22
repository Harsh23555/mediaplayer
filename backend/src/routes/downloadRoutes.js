import express from 'express';
import { prisma } from '../server.js';
import downloadService from '../services/downloadService.js';

const router = express.Router();

// Get all downloads
router.get('/', async (req, res) => {
    try {
        const downloads = await prisma.download.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(downloads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get download by ID
router.get('/:id', async (req, res) => {
    try {
        const download = await prisma.download.findUnique({
            where: { id: req.params.id }
        });

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
        const { url, quality, type, title } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const download = await prisma.download.create({
            data: {
                url,
                title: title || 'Untitled',
                quality: quality || '1080p',
                type: type || 'video',
                status: 'pending'
            }
        });

        res.status(201).json(download);

        // Trigger background download process
        try {
            await downloadService.processDownload(download.id);
        } catch (error) {
            console.error('Download process error:', error);
            // Update download status to failed
            await prisma.download.update({
                where: { id: download.id },
                data: {
                    status: 'failed',
                    error: error.message
                }
            }).catch(err => console.error('Failed to update download status:', err));
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pause download
router.post('/:id/pause', async (req, res) => {
    try {
        const download = await prisma.download.findUnique({
            where: { id: req.params.id }
        });

        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        if (download.status !== 'downloading') {
            return res.status(400).json({ error: 'Download is not in progress' });
        }

        const updated = await prisma.download.update({
            where: { id: req.params.id },
            data: { status: 'paused' }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Resume download
router.post('/:id/resume', async (req, res) => {
    try {
        const download = await prisma.download.findUnique({
            where: { id: req.params.id }
        });

        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        if (download.status !== 'paused') {
            return res.status(400).json({ error: 'Download is not paused' });
        }

        const updated = await prisma.download.update({
            where: { id: req.params.id },
            data: { status: 'downloading' }
        });

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel download
router.delete('/:id', async (req, res) => {
    try {
        const download = await prisma.download.findUnique({
            where: { id: req.params.id }
        });

        if (!download) {
            return res.status(404).json({ error: 'Download not found' });
        }

        const updated = await prisma.download.update({
            where: { id: req.params.id },
            data: { status: 'cancelled' }
        });

        res.json({ message: 'Download cancelled successfully', download: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
