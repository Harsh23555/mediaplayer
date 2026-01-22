/**
 * Media Preview and Thumbnail Generation Utilities
 * Handles video thumbnail extraction, preview generation, and metadata enrichment
 */

// Supported formats for different operations
export const MEDIA_FORMATS = {
    video: {
        supported: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'ogv', 'm4v'],
        extensions: /\.(mp4|webm|mov|avi|mkv|flv|wmv|ogv|m4v)$/i
    },
    audio: {
        supported: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma', 'opus', 'ape'],
        extensions: /\.(mp3|wav|aac|m4a|flac|ogg|wma|opus|ape)$/i
    }
};

/**
 * Generate thumbnail from video file
 * Extracts frame at 5% timestamp for better visual representation
 */
export async function generateVideoThumbnail(file, fileHandle = null) {
    try {
        const videoBlob = fileHandle ? await fileHandle.getFile() : file;
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';
            video.muted = true;
            
            // Set time to 5% of duration for better thumbnail
            video.onloadedmetadata = () => {
                // Seek to 5% of video
                video.currentTime = video.duration * 0.05;
            };
            
            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob(
                        (blob) => {
                            URL.revokeObjectURL(videoUrl);
                            const thumbnailUrl = URL.createObjectURL(blob);
                            resolve(thumbnailUrl);
                        },
                        'image/jpeg',
                        0.8
                    );
                } catch (err) {
                    URL.revokeObjectURL(videoUrl);
                    reject(err);
                }
            };
            
            video.onerror = () => {
                URL.revokeObjectURL(videoUrl);
                reject(new Error('Failed to load video'));
            };
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (video.readyState < 2) {
                    URL.revokeObjectURL(videoUrl);
                    reject(new Error('Video thumbnail generation timeout'));
                }
            }, 5000);
        });
    } catch (err) {
        console.error('Thumbnail generation error:', err);
        return null;
    }
}

/**
 * Get file type (video or audio)
 */
export function getMediaType(filename) {
    const lowerName = filename.toLowerCase();
    
    if (MEDIA_FORMATS.video.extensions.test(lowerName)) {
        return 'video';
    } else if (MEDIA_FORMATS.audio.extensions.test(lowerName)) {
        return 'audio';
    }
    
    return 'unknown';
}

/**
 * Check if format is supported for playback
 */
export function isSupportedFormat(filename) {
    const type = getMediaType(filename);
    return type !== 'unknown';
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Format duration from seconds
 */
export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Extract metadata from audio file (ID3 tags if available)
 * Falls back to filename parsing
 */
export async function extractAudioMetadata(fileHandle) {
    try {
        const file = await fileHandle.getFile();
        const filename = file.name;
        
        // Try to parse filename pattern: Artist - Song.mp3 or Song - Artist.mp3
        const parts = filename.replace(/\.[^.]+$/, '').split(/\s*[-–]\s*/);
        
        return {
            title: parts[0] || filename,
            artist: parts[1] || 'Unknown Artist',
            album: null,
            duration: null
        };
    } catch (err) {
        return {
            title: 'Unknown',
            artist: 'Unknown Artist',
            album: null,
            duration: null
        };
    }
}

/**
 * Preload and cache thumbnails for multiple videos
 * Useful for performance optimization
 */
export async function preloadThumbnails(files, fileHandles = []) {
    const thumbnails = new Map();
    
    for (const file of files) {
        if (file.type === 'video' && !file.thumbnail) {
            try {
                const handle = fileHandles.find(h => h.name === file.name);
                const thumb = await generateVideoThumbnail(file, handle);
                if (thumb) {
                    thumbnails.set(file.id, thumb);
                }
            } catch (err) {
                console.warn(`Failed to generate thumbnail for ${file.name}:`, err);
            }
        }
    }
    
    return thumbnails;
}

/**
 * Clean up blob URLs to prevent memory leaks
 */
export function revokeThumbnailUrl(url) {
    if (url && url.startsWith('blob:')) {
        try {
            URL.revokeObjectURL(url);
        } catch (err) {
            console.warn('Error revoking thumbnail URL:', err);
        }
    }
}

/**
 * Validate media file before playback
 */
export function validateMediaFile(file) {
    const errors = [];
    
    if (!file) {
        errors.push('No file selected');
    } else if (!isSupportedFormat(file.name)) {
        errors.push(`File format not supported: ${getFileExtension(file.name)}`);
    } else if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
        errors.push('File is too large (max 2GB)');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
