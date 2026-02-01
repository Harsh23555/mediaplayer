import express from 'express';
import { prisma } from '../server.js';
import downloadService from '../services/downloadService.js';
import ytDlp from 'yt-dlp-exec';
const { exec } = ytDlp;

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

// Stream direct download
router.get('/stream-direct', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        // Set headers for download
        res.setHeader('Content-Disposition', 'attachment; filename="download.mp4"');
        res.setHeader('Content-Type', 'video/mp4');

        const ytArgs = {
            output: '-',
            format: 'best[ext=mp4]/best',
            noPlaylist: true,
            extractorArgs: 'youtube:player_client=android',
            noCheckCertificates: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        };

        const subprocess = exec(url, ytArgs);

        subprocess.stdout.pipe(res);

        subprocess.stderr.on('data', (data) => {
            // console.log('Stderr:', data.toString()); 
            // Optional: Log progress but don't crash
        });

        subprocess.on('close', (code) => {
            if (code !== 0) {
                console.error(`yt-dlp process exited with code ${code}`);
                // Can't send error response if headers already sent
            }
        });

    } catch (error) {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).send('Stream error');
        }
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
        const { url, quality, type, title, mode } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const isBrowserMode = mode === 'browser';

        const download = await prisma.download.create({
            data: {
                url,
                title: title || 'Untitled',
                quality: quality || '1080p',
                type: type || 'video',
                status: isBrowserMode ? 'completed' : 'pending',
                progress: isBrowserMode ? 100 : 0,
                completedAt: isBrowserMode ? new Date() : null
            }
        });

        res.status(201).json(download);

        // Limit background download to non-browser mode
        if (!isBrowserMode) {
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
