import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500000000 // 500MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedExts = /mp4|webm|mkv|avi|mov|mp3|wav|flac|aac|ogg/;
        const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedExts.test(file.mimetype);

        if (extname || mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video and audio files are allowed.'));
        }
    }
});

// Get all media
router.get('/', async (req, res) => {
    try {
        const { type, search, sort = '-createdAt', limit = 50, page = 1 } = req.query;

        const query = {};
        if (type) query.type = type;
        if (search) query.$text = { $search: search };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const media = await Media.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Media.countDocuments(query);

        res.json({
            data: media,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get media by ID
router.get('/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload media
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, type } = req.body;
        const fileType = type || (req.file.mimetype.startsWith('video') ? 'video' : 'audio');

        const media = new Media({
            title: title || req.file.originalname,
            type: fileType,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            format: path.extname(req.file.originalname).substring(1)
        });

        await media.save();

        res.status(201).json(media);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stream media
router.get('/:id/stream', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        const filePath = media.path;
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': media.type === 'video' ? 'video/mp4' : 'audio/mpeg',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }

        // Update play count
        media.playCount += 1;
        media.lastPlayed = new Date();
        await media.save();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete media
router.delete('/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Delete file from filesystem
        if (fs.existsSync(media.path)) {
            fs.unlinkSync(media.path);
        }

        await Media.findByIdAndDelete(req.params.id);

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
