import express from 'express';
import { prisma } from '../prisma.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all playlists for current user
router.get('/', async (req, res) => {
    try {
        const playlists = await prisma.playlist.findMany({
            where: { userId: req.userId },
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

// Get playlist by ID (must belong to user)
router.get('/:id', async (req, res) => {
    try {
        const playlist = await prisma.playlist.findFirst({
            where: {
                id: req.params.id,
                userId: req.userId
            },
            include: {
                items: {
                    include: {
                        media: true
                    }
                }
            }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
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
                isPublic: isPublic || false,
                userId: req.userId
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

        // Verify ownership
        const existing = await prisma.playlist.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

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

        // Check if playlist exists and belongs to user
        const playlist = await prisma.playlist.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

        // Check if media exists and belongs to user
        const media = await prisma.media.findFirst({
            where: { id: mediaId, userId: req.userId }
        });

        if (!media) {
            return res.status(404).json({ error: 'Media not found or unauthorized' });
        }

        // Add item to playlist
        await prisma.playlistItem.create({
            data: {
                mediaId,
                playlistId: req.params.id
            }
        }).catch(err => {
            if (err.code === 'P2002') {
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
        // Verify playlist ownership
        const playlist = await prisma.playlist.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

        await prisma.playlistItem.delete({
            where: { id: req.params.itemId, playlistId: req.params.id }
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
        res.status(500).json({ error: error.message });
    }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        const playlist = await prisma.playlist.findFirst({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found or unauthorized' });
        }

        await prisma.playlist.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Playlist deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
