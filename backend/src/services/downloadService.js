import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { prisma } from '../server.js';

// Import ytdl with error handling
let ytdl = null;
try {
    const ytdlModule = await import('ytdl-core');
    ytdl = ytdlModule.default;
} catch (err) {
    console.warn('ytdl-core not available, YouTube downloads disabled');
}

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

            const downloadDir = path.join(__dirname, '../../uploads/downloads');
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }

            // Determine if it's a YouTube URL
            const isYouTube = ytdl && ytdl.validateURL(download.url);

            if (isYouTube) {
                await downloadService.downloadYouTube(download, downloadDir);
            } else {
                await downloadService.downloadGeneric(download, downloadDir);
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
        try {
            if (!ytdl) throw new Error('YouTube download not available');
            
            const info = await ytdl.getInfo(download.url);
            const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 100);
            const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

            const filename = `${Date.now()}-${title}.${format.container || 'mp4'}`;
            const filePath = path.join(downloadDir, filename);

            await prisma.download.update({
                where: { id: download.id },
                data: {
                    title: title,
                    filePath: filePath,
                    size: format.contentLength ? parseInt(format.contentLength) : 0
                }
            });

            const videoStream = ytdl.downloadFromInfo(info, { format: format });
            const fileStream = fs.createWriteStream(filePath);

            let downloadedBytes = 0;
            const totalBytes = parseInt(format.contentLength || 0);

            // Updating progress periodically
            const progressInterval = setInterval(async () => {
                if (downloadedBytes > 0) {
                    const progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
                    await prisma.download.update({
                        where: { id: download.id },
                        data: {
                            progress: progress,
                            downloadedSize: downloadedBytes
                        }
                    }).catch(err => console.error('Progress update error:', err));
                }
            }, 1000);

            videoStream.on('data', (chunk) => {
                downloadedBytes += chunk.length;
            });

            videoStream.pipe(fileStream);

            return new Promise((resolve, reject) => {
                fileStream.on('finish', async () => {
                    clearInterval(progressInterval);
                    try {
                        await prisma.download.update({
                            where: { id: download.id },
                            data: {
                                status: 'completed',
                                progress: 100,
                                downloadedSize: downloadedBytes,
                                completedAt: new Date()
                            }
                        });
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                fileStream.on('error', (err) => {
                    clearInterval(progressInterval);
                    reject(err);
                });

                videoStream.on('error', (err) => {
                    clearInterval(progressInterval);
                    reject(err);
                });
            });

        } catch (error) {
            throw error;
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

                const protocol = download.url.startsWith('https') ? https : http;
                
                const req = protocol.get(download.url, async (res) => {
                    if (res.statusCode !== 200) {
                        return reject(new Error(`Failed to download: Status Code ${res.statusCode}`));
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

            } catch (error) {
                reject(error);
            }
        });
    },
};

export default downloadService;

