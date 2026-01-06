import express from 'express';
import Playlist from '../models/Playlist.js';

const router = express.Router();

// Get all playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await Playlist.find()
            .populate('items.mediaId')
            .sort('-createdAt');
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get playlist by ID
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('items.mediaId');
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create playlist
router.post('/', async (req, res) => {
    try {
        const { name, description, items } = req.body;

        const playlist = new Playlist({
            name,
            description,
            items: items || []
        });

        await playlist.save();
        res.status(201).json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update playlist
router.put('/:id', async (req, res) => {
    try {
        const { name, description, items } = req.body;

        const playlist = await Playlist.findByIdAndUpdate(
            req.params.id,
            { name, description, items },
            { new: true, runValidators: true }
        ).populate('items.mediaId');

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add item to playlist
router.post('/:id/items', async (req, res) => {
    try {
        const { mediaId } = req.body;

        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        playlist.items.push({ mediaId });
        await playlist.save();

        await playlist.populate('items.mediaId');

        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove item from playlist
router.delete('/:id/items/:itemId', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        playlist.items = playlist.items.filter(
            item => item._id.toString() !== req.params.itemId
        );

        await playlist.save();
        await playlist.populate('items.mediaId');

        res.json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findByIdAndDelete(req.params.id);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
