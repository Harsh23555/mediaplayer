import express from 'express';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Extract subtitles from video
router.post('/extract', async (req, res) => {
    try {
        const { videoId } = req.body;

        if (!videoId) {
            return res.status(400).json({ error: 'Video ID is required' });
        }

        import('../services/subtitleService.js').then(async module => {
            const result = await module.default.extract(videoId, req.userId);
            res.json(result);
        }).catch(err => {
            console.error(err);
            res.status(500).json({ error: err.message });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Translate subtitle
router.post('/translate', async (req, res) => {
    try {
        const { subtitleId, targetLang } = req.body;

        if (!subtitleId || !targetLang) {
            return res.status(400).json({ error: 'Subtitle ID and target language are required' });
        }

        import('../services/subtitleService.js').then(async module => {
            try {
                const result = await module.default.translate(subtitleId, targetLang, req.userId);
                res.json(result);
            } catch (e) {
                res.status(501).json({ error: e.message }); // 501 Not Implemented
            }
        }).catch(err => res.status(500).json({ error: err.message }));

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get subtitle file
router.get('/:id', async (req, res) => {
    try {
        import('../services/subtitleService.js').then(async module => {
            const content = await module.default.getSubtitleContent(req.params.id, req.userId);
            // Determine content type - assuming VTT
            res.setHeader('Content-Type', 'text/vtt');
            res.send(content);
        }).catch(err => {
            if (err.message.includes('not found')) return res.status(404).json({ error: err.message });
            res.status(500).json({ error: err.message });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
