import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkMedia() {
    try {
        const media = await prisma.media.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        let output = '';
        media.forEach(m => {
            output += `ID: ${m.id} | Title: ${m.title} | Format: ${m.format} | Path: ${m.path}\n`;
        });
        fs.writeFileSync('media_debug.txt', output);
        console.log('Results written to media_debug.txt');
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkMedia();
