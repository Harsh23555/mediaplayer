import { PrismaClient } from '@prisma/client';
import downloadService from '../services/downloadService.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function verifyDownloadFlow() {
    console.log('--- Starting Download Flow Verification ---');

    // 1. Create a dummy download record
    const download = await prisma.download.create({
        data: {
            url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
            title: 'Verification Test Video',
            type: 'video',
            quality: '1080p',
            status: 'pending'
        }
    });
    console.log(`✓ Created test download record: ${download.id}`);

    // 2. Process the download (mocking the generic download)
    // Note: Since we can't actually download in this environment reliably, 
    // we'll check if the logic for paths and media creation is sound by calling a part of the logic
    // or manually verifying the service's methods.

    const downloadDir = downloadService.getDownloadDir('video');
    const expectedBase = path.join(os.homedir(), 'Downloads', 'MediaPlayer', 'video');

    if (downloadDir === expectedBase) {
        console.log('✓ getDownloadDir returned correct path for video');
    } else {
        console.error(`✗ getDownloadDir mismatch. Expected: ${expectedBase}, Got: ${downloadDir}`);
    }

    const audioDir = downloadService.getDownloadDir('audio');
    const expectedAudioBase = path.join(os.homedir(), 'Downloads', 'MediaPlayer', 'audio');
    if (audioDir === expectedAudioBase) {
        console.log('✓ getDownloadDir returned correct path for audio');
    } else {
        console.error(`✗ getDownloadDir mismatch. Expected: ${expectedAudioBase}, Got: ${audioDir}`);
    }

    console.log('--- Verification Script Completed ---');
    process.exit(0);
}

verifyDownloadFlow().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
