import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';

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
        const { type, search, sort = 'createdAt', limit = 50, page = 1 } = req.query;

        const where = {};
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { filename: { contains: search, mode: 'insensitive' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where,
                orderBy: { [sort]: 'desc' },
                take: parseInt(limit),
                skip
            }),
            prisma.media.count({ where })
        ]);

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
        const media = await prisma.media.findUnique({
            where: { id: req.params.id }
        });

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        res.json(media);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload media
router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer upload error:', err);
            return res.status(400).json({ error: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Unknown upload error:', err);
            return res.status(500).json({ error: `Upload error: ${err.message}` });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, type } = req.body;

        // Determine file type based on mimetype
        const fileType = type || (req.file.mimetype.startsWith('audio') ? 'audio' : 'video');

        console.log(`Uploading file: ${req.file.originalname}, type: ${fileType}`);

        const media = await prisma.media.create({
            data: {
                title: title || req.file.originalname,
                type: fileType.toLowerCase(), // Ensure it matches enum values
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                format: path.extname(req.file.originalname).substring(1).toLowerCase()
            }
        });

        console.log(`✓ File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
        res.status(201).json(media);
    } catch (error) {
        console.error('Media save error:', error.message);
        console.error('Error details:', error);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

// Stream media
router.get('/:id/stream', async (req, res) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id }
        });

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        const filePath = media.path;
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        const mimeTypes = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            mov: 'video/quicktime',
            avi: 'video/x-msvideo',
            mkv: 'video/x-matroska',
            flv: 'video/x-flv',
            wmv: 'video/x-ms-wmv',
            ogv: 'video/ogg',
            m4v: 'video/x-m4v',
            '3gp': 'video/3gpp',
            mxf: 'application/mxf',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            aac: 'audio/aac',
            m4a: 'audio/mp4',
            flac: 'audio/flac',
            ogg: 'audio/ogg',
            wma: 'audio/x-ms-wma',
            opus: 'audio/opus',
            ape: 'audio/x-ape',
            aiff: 'audio/x-aiff'
        };
        const contentType = mimeTypes[ext] || 'video/mp4';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType
            });

            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.header('Content-Length', fileSize);
            res.header('Content-Type', contentType);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update media
router.put('/:id', async (req, res) => {
    try {
        const media = await prisma.media.update({
            where: { id: req.params.id },
            data: req.body
        });

        res.json(media);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Media not found' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Delete media
router.delete('/:id', async (req, res) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id }
        });

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Delete the file from disk
        if (fs.existsSync(media.path)) {
            fs.unlinkSync(media.path);
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Scan local directory for media files (fallback for browsers without File System Access API)
router.post('/scan/local', async (req, res) => {
    try {
        const { directoryPath } = req.body;

        if (!directoryPath) {
            return res.status(400).json({ error: 'Directory path is required' });
        }

        // Security: Prevent directory traversal attacks
        if (directoryPath.includes('..') || !fs.existsSync(directoryPath)) {
            return res.status(400).json({ error: 'Invalid directory path' });
        }

        const supportedExtensions = {
            video: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'mxf', '3gp'],
            audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'],
        };

        const mediaFiles = [];

        // Recursive function to scan directories
        function scanDir(dir, maxDepth = 5, currentDepth = 0) {
            if (currentDepth > maxDepth) return;

            try {
                const files = fs.readdirSync(dir, { withFileTypes: true });

                files.forEach((file) => {
                    try {
                        const fullPath = path.join(dir, file.name);

                        if (file.isDirectory()) {
                            // Skip system and hidden directories
                            if (!file.name.startsWith('.') && !['node_modules', 'System Volume Information', '$RECYCLE.BIN'].includes(file.name)) {
                                scanDir(fullPath, maxDepth, currentDepth + 1);
                            }
                        } else if (file.isFile()) {
                            const ext = path.extname(file.name).toLowerCase().replace('.', '');
                            let type = null;

                            if (supportedExtensions.video.includes(ext)) {
                                type = 'video';
                            } else if (supportedExtensions.audio.includes(ext)) {
                                type = 'audio';
                            }

                            if (type) {
                                const stat = fs.statSync(fullPath);
                                mediaFiles.push({
                                    id: `local_${Date.now()}_${Math.random()}`,
                                    name: file.name,
                                    title: file.name.replace(/\.[^.]+$/, ''),
                                    type: type,
                                    size: stat.size,
                                    path: fullPath,
                                    source: 'local',
                                    lastModified: stat.mtimeMs,
                                });
                            }
                        }
                    } catch (err) {
                        console.warn(`Error processing file ${file.name}:`, err.message);
                    }
                });
            } catch (err) {
                console.error(`Error scanning directory ${dir}:`, err.message);
            }
        }

        scanDir(directoryPath);

        res.json({
            success: true,
            count: mediaFiles.length,
            files: mediaFiles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stream local file by path (for files scanned via backend)
router.get('/local/stream', async (req, res) => {
    try {
        const { path: filePath } = req.query;

        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        // Decode path if it was encoded
        const decodedPath = decodeURIComponent(filePath);

        if (!fs.existsSync(decodedPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stat = fs.statSync(decodedPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        const ext = path.extname(decodedPath).toLowerCase().replace('.', '');
        const mimeTypes = {
            mp4: 'video/mp4',
            webm: 'video/webm',
            mov: 'video/quicktime',
            avi: 'video/x-msvideo',
            mkv: 'video/x-matroska',
            flv: 'video/x-flv',
            wmv: 'video/x-ms-wmv',
            ogv: 'video/ogg',
            m4v: 'video/x-m4v',
            '3gp': 'video/3gpp',
            mp3: 'audio/mpeg',
            wav: 'audio/wav',
            aac: 'audio/aac',
            m4a: 'audio/mp4',
            flac: 'audio/flac',
            ogg: 'audio/ogg',
            wma: 'audio/x-ms-wma',
            opus: 'audio/opus',
            ape: 'audio/x-ape'
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType
            });

            fs.createReadStream(decodedPath, { start, end }).pipe(res);
        } else {
            res.header('Content-Length', fileSize);
            res.header('Content-Type', contentType);
            fs.createReadStream(decodedPath).pipe(res);
        }
    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
