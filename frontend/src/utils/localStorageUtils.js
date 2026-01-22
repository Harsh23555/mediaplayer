// Supported media file extensions
const SUPPORTED_EXTENSIONS = {
    video: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv', 'mxf', '3gp'],
    audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'aiff'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
    document: ['pdf', 'txt', 'md', 'json']
};

import { mediaAPI } from './api';

/**
 * Recursively scan directory for media files using File System Access API
 * @param {FileSystemDirectoryHandle} dirHandle - Directory handle from the File System Access API
 * @param {Array} mediaFiles - Accumulator for found media files
 * @param {number} maxDepth - Maximum recursion depth
 * @param {number} currentDepth - Current recursion depth
 * @param {string} folderId - ID of the source folder
 * @returns {Promise<Array>} Array of media files found
 */
export async function scanDirectory(dirHandle, mediaFiles = [], maxDepth = 5, currentDepth = 0, folderId = 'default') {
    if (currentDepth > maxDepth) return mediaFiles;

    try {
        for await (const entry of dirHandle.values()) {
            try {
                if (entry.kind === 'file') {
                    const ext = entry.name.split('.').pop().toLowerCase();
                    const type = getMediaType(ext);

                    if (type) {
                        const file = await entry.getFile();
                        mediaFiles.push({
                            id: `local_${folderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: entry.name,
                            title: entry.name.replace(/\.[^.]+$/, ''),
                            type: type,
                            size: file.size,
                            handle: entry,
                            dirHandle: dirHandle,
                            folderId: folderId,
                            source: 'local',
                            lastModified: file.lastModified,
                            mimeType: file.type,
                        });
                    }
                } else if (entry.kind === 'directory' && currentDepth < maxDepth) {
                    // Skip system/hidden directories
                    if (!entry.name.startsWith('.') && !['node_modules', 'System Volume Information', '$RECYCLE.BIN'].includes(entry.name)) {
                        try {
                            await scanDirectory(entry, mediaFiles, maxDepth, currentDepth + 1, folderId);
                        } catch (err) {
                            console.warn(`Unable to scan subdirectory ${entry.name}:`, err.message);
                        }
                    }
                }
            } catch (err) {
                console.warn(`Error processing entry ${entry.name}:`, err.message);
                continue;
            }
        }
    } catch (err) {
        console.error('Error scanning directory:', err);
        throw err;
    }

    return mediaFiles;
}

/**
 * Determine media type based on file extension
 * @param {string} extension - File extension
 * @returns {string|null} Media type ('video', 'audio', 'image', 'document') or null if not supported
 */
function getMediaType(extension) {
    if (SUPPORTED_EXTENSIONS.video.includes(extension)) return 'video';
    if (SUPPORTED_EXTENSIONS.audio.includes(extension)) return 'audio';
    if (SUPPORTED_EXTENSIONS.image.includes(extension)) return 'image';
    if (SUPPORTED_EXTENSIONS.document.includes(extension)) return 'document';
    return null;
}

/**
 * Request permission to access local file system using File System Access API
 * Only works in secure context (HTTPS) and supported browsers
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function requestLocalStoragePermission() {
    try {
        // Check if File System Access API is supported
        if (!('showDirectoryPicker' in window)) {
            throw new Error(
                'File System Access API is not supported in your browser. ' +
                'Please use Chrome, Edge, or Opera for local file access.'
            );
        }

        // Show directory picker
        const dirHandle = await window.showDirectoryPicker({
            mode: 'read',
            startIn: 'documents', // or 'downloads', 'desktop', 'music', 'pictures', 'videos'
        });

        return dirHandle;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('User cancelled the folder selection');
        }
        throw err;
    }
}

/**
 * Play a local file using the File System Access API
 * @param {FileSystemFileHandle} fileHandle - File handle
 * @returns {Promise<string>} Object URL for the file
 */
export async function getLocalFileURL(fileHandle) {
    try {
        if (fileHandle.handle) {
            const file = await fileHandle.handle.getFile();
            return URL.createObjectURL(file);
        } else if (fileHandle.path && fileHandle.source === 'local') {
            // Use backend streaming for files without handles (e.g. from backend scan)
            return mediaAPI.streamLocal(fileHandle.path);
        }
        return null; // Or throw error
    } catch (err) {
        console.error('Error getting file URL:', err);
        throw err;
    }
}

/**
 * Clean up object URLs to prevent memory leaks
 * @param {string} url - Object URL to revoke
 */
export function revokeLocalFileURL(url) {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get supported file extensions as a readable string
 * @returns {object} Object with 'video' and 'audio' properties
 */
export function getSupportedFormats() {
    return {
        video: SUPPORTED_EXTENSIONS.video.map(ext => `.${ext}`).join(', '),
        audio: SUPPORTED_EXTENSIONS.audio.map(ext => `.${ext}`).join(', '),
        image: SUPPORTED_EXTENSIONS.image.map(ext => `.${ext}`).join(', '),
        document: SUPPORTED_EXTENSIONS.document.map(ext => `.${ext}`).join(', '),
    };
}

