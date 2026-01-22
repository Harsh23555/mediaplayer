import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Media from '../models/Media.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const subtitleService = {
    extract: async (videoId) => {
        const media = await Media.findById(videoId);
        if (!media) throw new Error('Media not found');

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
                    const filename = `${media._id}-s${index}-${lang}.vtt`; // WebVTT is best for web
                    const outputPath = path.join(uploadDir, filename);

                    ffmpeg(media.path)
                        .output(outputPath)
                        .outputOptions([
                            `-map 0:${stream.index}`,
                            '-f webvtt' // Convert to VTT
                        ])
                        .on('end', async () => {
                            extractedSubs.push({
                                language: lang,
                                path: outputPath,
                                filename: filename
                            });

                            processed++;
                            if (processed === subtitleStreams.length) {
                                // Save to DB
                                // Avoid duplicates
                                extractedSubs.forEach(sub => {
                                    const exists = media.subtitles.find(s => s.path === sub.path);
                                    if (!exists) {
                                        media.subtitles.push({
                                            language: sub.language,
                                            path: sub.path
                                        });
                                    }
                                });
                                await media.save();
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

    translate: async (subtitleId, targetLang) => {
        // This is a placeholder/mock because real translation requires an API key (Google/DeepL)
        // We will "simulate" translation by reading the source file and just updating metadata/creating a new file

        // Find media containing this subtitle (this logic assumes subtitleId is an ID in Media.subtitles, 
        // but currently Media.subtitles is an array of objects without separate global IDs, usually addressed by MediaID + Sub index or similar.
        // The current Route passes "subtitleId", but our schema is embedded. 
        // We might need to adjust logic to receive MediaID + SubtitlePath/Language.
        // For now, let's assume "subtitleId" is actually "mediaId" and "language" (source) is passed?
        // The route expects `subtitleId`, let's check basic assumption.
        // Let's implement a simple logic: The user probably wants to translate an EXISTING subtitle to a TARGET lang.

        // Since we don't have a Subtitle model, we'll try to find the Media that has this specific subtitle.
        // Or simpler: We just return a mock response saying "API Key Required" but for the sake of "completing" the backend:

        throw new Error("Translation Service requires external API Key. Feature pending.");
    },

    getSubtitleContent: async (id) => {
        // ID could be the media ID and we return list, or specific subtitle?
        // Let's implement retrieving a file if "id" is the filename or part of the path?
        // Route says `get /:id`.

        // Let's assume ID is the specific subtitle entry ID (Mongoose subdocument ID)
        // We need to search all media to find this subdocument.
        const media = await Media.findOne({ 'subtitles._id': id });

        if (media) {
            const sub = media.subtitles.id(id);
            if (sub && fs.existsSync(sub.path)) {
                return fs.readFileSync(sub.path, 'utf8');
            }
        }

        // Fallback: maybe ID is mediaID?
        // If ID is mediaID, return list of subtitles? No, usually that's under GET /media/:id

        throw new Error('Subtitle not found');
    }
};

export default subtitleService;
