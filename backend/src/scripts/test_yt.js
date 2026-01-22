import { createYtDlp } from 'yt-dlp-exec';

const youtubeDl = createYtDlp();

async function test() {
    console.log('Testing yt-dlp metadata fetching...');
    try {
        const metadata = await youtubeDl('https://www.youtube.com/watch?v=aqz-KE-bpKQ', {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
        });
        console.log('Title:', metadata.title);
        console.log('Success!');
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
