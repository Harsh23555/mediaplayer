import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import NodeID3 from 'node-id3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMBNAIL_DIR = path.join(__dirname, '../../uploads/thumbnails');

// Ensure thumbnail directory exists
if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

const categorizeMedia = (filename, type) => {
    const name = filename.toLowerCase();

    if (type === 'video') {
        // TV Shows often have S01E01, etc.
        if (/[sS]\d+[eE]\d+/.test(name) || /season\s*\d+/i.test(name)) return 'tv_show';
        if (name.includes('movie') || name.includes('film')) return 'movie';
        return 'video';
    } else if (type === 'audio') {
        if (name.includes('podcast')) return 'podcast';
        return 'music';
    }
    return type;
};

export const processMediaMetadata = async (filePath, type) => {
    return new Promise((resolve) => {
        const filename = path.basename(filePath);
        const metadata = {
            duration: 0,
            thumbnail: null,
            artist: null,
            album: null,
            category: categorizeMedia(filename, type)
        };

        ffmpeg.ffprobe(filePath, async (err, info) => {
            if (err) {
                console.error('ffprobe error:', err);
                return resolve(metadata);
            }

            metadata.duration = info.format.duration ? Math.round(info.format.duration) : 0;

            if (type === 'video') {
                const thumbName = `thumb-${Date.now()}-${Math.round(Math.random() * 1000)}.jpg`;
                const thumbPath = path.join(THUMBNAIL_DIR, thumbName);

                ffmpeg(filePath)
                    .screenshots({
                        timestamps: ['10%'],
                        filename: thumbName,
                        folder: THUMBNAIL_DIR,
                        size: '640x360'
                    })
                    .on('end', () => {
                        metadata.thumbnail = `/uploads/thumbnails/${thumbName}`;
                        resolve(metadata);
                    })
                    .on('error', (err) => {
                        console.error('Thumbnail generation error:', err);
                        resolve(metadata);
                    });
            } else if (type === 'audio') {
                try {
                    const tags = NodeID3.read(filePath);
                    if (tags) {
                        metadata.artist = tags.artist || null;
                        metadata.album = tags.album || null;

                        if (tags.image && tags.image.imageBuffer) {
                            const thumbName = `thumb-audio-${Date.now()}.jpg`;
                            const thumbPath = path.join(THUMBNAIL_DIR, thumbName);
                            fs.writeFileSync(thumbPath, tags.image.imageBuffer);
                            metadata.thumbnail = `/uploads/thumbnails/${thumbName}`;
                        }
                    }
                } catch (id3Err) {
                    console.error('ID3 read error:', id3Err);
                }
                resolve(metadata);
            } else {
                resolve(metadata);
            }
        });
    });
};
