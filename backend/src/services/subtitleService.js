import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prisma.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const subtitleService = {
    extract: async (videoId, userId) => {
        const media = await prisma.media.findFirst({
            where: { id: videoId, userId: userId }
        });
        if (!media) throw new Error('Media not found or unauthorized');

        const uploadDir = path.join(__dirname, '../../uploads/subtitles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            // First probe to see if there are subtitles
            ffmpeg.ffprobe(media.path, (err, metadata) => {
                if (err) return reject(err);

                const subtitleStreams = metadata.streams.filter(s => s.codec_type === 'subtitle');
                if (subtitleStreams.length === 0) {
                    return resolve({ message: 'No embedded subtitles found', streams: 0 });
                }

                const extractedSubs = [];
                let processed = 0;

                subtitleStreams.forEach((stream, index) => {
                    // Try to determine language
                    const lang = stream.tags?.language || 'und';
                    const id = crypto.randomUUID();
                    const filename = `${media.id}-${id}-${lang}.vtt`; // WebVTT is best for web
                    const outputPath = path.join(uploadDir, filename);

                    ffmpeg(media.path)
                        .output(outputPath)
                        .outputOptions([
                            `-map 0:${stream.index}`,
                            '-f webvtt' // Convert to VTT
                        ])
                        .on('end', async () => {
                            extractedSubs.push({
                                id,
                                language: lang,
                                path: outputPath,
                                filename: filename,
                                url: `/api/subtitles/file/${filename}` // Custom URL for retrieval
                            });

                            processed++;
                            if (processed === subtitleStreams.length) {
                                // Update media subtitles JSON
                                const currentSubs = Array.isArray(media.subtitles) ? media.subtitles : [];
                                const newSubs = [...currentSubs];

                                extractedSubs.forEach(sub => {
                                    if (!newSubs.find(s => s.language === sub.language && s.path === sub.path)) {
                                        newSubs.push(sub);
                                    }
                                });

                                await prisma.media.update({
                                    where: { id: media.id },
                                    data: { subtitles: newSubs }
                                });

                                resolve({ message: 'Subtitles extracted', count: processed, subtitles: extractedSubs });
                            }
                        })
                        .on('error', (err) => {
                            console.error(`Error extracting stream ${index}:`, err);
                            processed++; // Count as processed to avoid hanging
                            if (processed === subtitleStreams.length) resolve({ message: 'Partial extraction completed', errors: true });
                        })
                        .run();
                });
            });
        });
    },

    translate: async (subtitleId, targetLang, userId) => {
        // This is a placeholder/mock because real translation requires an API key (Google/DeepL)
        // We will "simulate" translation by reading the source file and just updating metadata/creating a new file

        // Find media that owns this subtitle
        const media = await prisma.media.findFirst({
            where: {
                userId,
                subtitles: {
                    path: ['$', '*'],
                    array_contains: { id: subtitleId }
                }
            }
        });

        if (!media) throw new Error('Subtitle not found or unauthorized');
        throw new Error("Translation Service requires external API Key. Feature pending.");
    },

    getSubtitleContent: async (id, userId) => {
        // ID could be the media ID and we return list, or specific subtitle?
        // Let's implement retrieving a file if "id" is the filename or part of the path?
        // Route says `get /:id`.

        // Search for media belonging to user that contains this subtitle id or matches filename
        // Simplest way is to find media with matching id in subtitles json
        const medias = await prisma.media.findMany({
            where: { userId }
        });

        for (const media of medias) {
            const subs = Array.isArray(media.subtitles) ? media.subtitles : [];
            const sub = subs.find(s => s.id === id || s.filename === id);
            if (sub && fs.existsSync(sub.path)) {
                return fs.readFileSync(sub.path, 'utf8');
            }
        }

        throw new Error('Subtitle not found or unauthorized');
    }
};

export default subtitleService;
