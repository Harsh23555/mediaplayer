import dotenv from 'dotenv';
dotenv.config();

import downloadService from '../services/downloadService.js';
import { prisma } from '../server.js';

async function verifyDownload() {
    console.log('--- Verifying YouTube Download ---');
    try {
        const ytDownload = await prisma.download.create({
            data: {
                url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', // A short video
                title: 'Test YouTube Video',
                quality: '720p',
                status: 'pending'
            }
        });
        console.log('Created YouTube download:', ytDownload.id);
        await downloadService.processDownload(ytDownload.id);
        console.log('YouTube download finished.');

        console.log('--- Verifying Instagram Download ---');
        const igDownload = await prisma.download.create({
            data: {
                url: 'https://www.instagram.com/reels/DFB20zFSuYQ/',
                title: 'Test Instagram Reel',
                quality: '1080p',
                status: 'pending'
            }
        });
        console.log('Created Instagram download:', igDownload.id);
        await downloadService.processDownload(igDownload.id);
        console.log('Instagram download finished.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDownload();
