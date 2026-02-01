import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import os from 'os';
import { fileURLToPath } from 'url';
import { prisma } from '../server.js';
import yt from 'yt-dlp-exec';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadService = {
    processDownload: async (downloadId) => {
        try {
            const download = await prisma.download.findUnique({
                where: { id: downloadId }
            });
            if (!download) {
                console.error('Download not found:', downloadId);
                return;
            }

            await prisma.download.update({
                where: { id: downloadId },
                data: { status: 'downloading' }
            });

            const downloadDir = path.join(os.homedir(), 'Downloads', 'MediaPlayer');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            // Try with yt-dlp (handles almost everything, including YouTube and generic files)
            try {
                await downloadService.downloadYouTube(download, downloadDir);
            } catch (ytError) {
                console.error('yt-dlp failed:', ytError.message);

                // Only fallback to generic if it's explicitly NOT a supported site
                // But yt-dlp supports almost everything. 
                // Using generic download for YouTube will just fail with "Invalid content type" (HTML)
                // So we assume if yt-dlp failed, the download effectively failed.
                throw ytError;
            }

        } catch (error) {
            console.error('Download processing error:', error);
            await prisma.download.update({
                where: { id: downloadId },
                data: {
                    status: 'failed',
                    error: error.message
                }
            });
        }
    },

    downloadYouTube: async (download, downloadDir) => {
        const title = (download.title || `download-${Date.now()}`).replace(/[^\w\s]/gi, '').substring(0, 100);
        const filename = `${Date.now()}-${title}.mp4`;
        const filePath = path.join(downloadDir, filename);

        // Pre-update to set filePath
        await prisma.download.update({
            where: { id: download.id },
            data: { filePath: filePath }
        });

        // Use yt-dlp with robust flags for avoiding 403s
        await yt(download.url, {
            output: filePath,
            format: 'best[ext=mp4]/best', // Prefer mp4, fallback to best
            noPlaylist: true,
            extractorArgs: 'youtube:player_client=android', // Critical for 403 bypass
            noCheckCertificates: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            ]
        });

        // Verify file exists and get size
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            await prisma.download.update({
                where: { id: download.id },
                data: {
                    status: 'completed',
                    progress: 100,
                    completedAt: new Date(),
                    size: stats.size,
                    downloadedSize: stats.size,
                    filePath: filePath
                }
            });
        } else {
            throw new Error('File not created by yt-dlp');
        }
    },

    downloadGeneric: async (download, downloadDir) => {
        return new Promise(async (resolve, reject) => {
            try {
                const finalFilename = `${Date.now()}-${(download.title || 'download').replace(/[^\w\s]/gi, '')}.mp4`;
                const filePath = path.join(downloadDir, finalFilename);
                const fileStream = fs.createWriteStream(filePath);

                await prisma.download.update({
                    where: { id: download.id },
                    data: { filePath: filePath }
                });

                const downloadFile = (url, redirectCount = 0) => {
                    if (redirectCount > 5) {
                        return reject(new Error('Too many redirects'));
                    }

                    const protocol = url.startsWith('https') ? https : http;
                    const options = {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    };

                    const req = protocol.get(url, options, async (res) => {
                        // Handle Redirects
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                            let newUrl = res.headers.location;
                            try {
                                newUrl = new URL(res.headers.location, url).href;
                            } catch (e) {
                                // Assume absolute or fail
                            }
                            return downloadFile(newUrl, redirectCount + 1);
                        }

                        if (res.statusCode !== 200) {
                            return reject(new Error(`Failed to download: Status Code ${res.statusCode}`));
                        }

                        // Validate Content-Type
                        const contentType = res.headers['content-type'] || '';
                        if (contentType.includes('text/html') || contentType.includes('application/json')) {
                            return reject(new Error(`Invalid content type: ${contentType}. The URL must be a direct link to a video/audio file, not a webpage.`));
                        }

                        const totalBytes = parseInt(res.headers['content-length'] || 0, 10);

                        let downloadedBytes = 0;

                        const progressInterval = setInterval(async () => {
                            if (downloadedBytes > 0) {
                                const progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
                                await prisma.download.update({
                                    where: { id: download.id },
                                    data: {
                                        progress: progress,
                                        downloadedSize: downloadedBytes,
                                        size: totalBytes
                                    }
                                }).catch(err => console.error('Progress update error:', err));
                            }
                        }, 1000);

                        res.on('data', (chunk) => {
                            downloadedBytes += chunk.length;
                            fileStream.write(chunk);
                        });

                        res.on('end', async () => {
                            clearInterval(progressInterval);
                            fileStream.end();

                            await prisma.download.update({
                                where: { id: download.id },
                                data: {
                                    status: 'completed',
                                    progress: 100,
                                    completedAt: new Date(),
                                    filePath: filePath,
                                    downloadedSize: downloadedBytes,
                                    size: totalBytes
                                }
                            });

                            resolve();
                        });

                        res.on('error', (err) => {
                            clearInterval(progressInterval);
                            fileStream.close();
                            reject(err);
                        });
                    });

                    req.on('error', (err) => {
                        reject(err);
                    });
                };

                downloadFile(download.url);

            } catch (error) {
                reject(error);
            }
        });
    },
};

export default downloadService;

