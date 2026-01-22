import express from 'express';
import { prisma } from '../prisma.js';

const router = express.Router();

// Get all playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await prisma.playlist.findMany({
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get playlist by ID
router.get('/:id', async (req, res) => {
    try {
        const playlist = await prisma.playlist.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

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
        const { name, description, isPublic } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }

        const playlist = await prisma.playlist.create({
            data: {
                name,
                description: description || '',
                isPublic: isPublic || false
            },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

        res.status(201).json(playlist);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update playlist
router.put('/:id', async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;

        const playlist = await prisma.playlist.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                isPublic
            },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

        res.json(playlist);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Add item to playlist
router.post('/:id/items', async (req, res) => {
    try {
        const { mediaId } = req.body;

        if (!mediaId) {
            return res.status(400).json({ error: 'mediaId is required' });
        }

        // Check if playlist exists
        const playlist = await prisma.playlist.findUnique({
            where: { id: req.params.id }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        // Check if media exists
        const media = await prisma.media.findUnique({
            where: { id: mediaId }
        });

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Add item to playlist (or skip if already exists)
        await prisma.playlistItem.create({
            data: {
                mediaId,
                playlistId: req.params.id
            }
        }).catch(err => {
            if (err.code === 'P2002') {
                // Item already exists in playlist
                throw new Error('Media item already exists in this playlist');
            }
            throw err;
        });

        const updatedPlaylist = await prisma.playlist.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

        res.json(updatedPlaylist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remove item from playlist
router.delete('/:id/items/:itemId', async (req, res) => {
    try {
        await prisma.playlistItem.delete({
            where: { id: req.params.itemId }
        });

        const playlist = await prisma.playlist.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

        res.json(playlist);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Playlist item not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        await prisma.playlist.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Playlist not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

export default router;
