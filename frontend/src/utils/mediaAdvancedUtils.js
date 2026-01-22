/**
 * Advanced Media Utilities
 * Handles metadata extraction, searching, sorting, grouping, and thumbnails
 */

import { formatFileSize, getLocalFileURL } from './localStorageUtils';

/**
 * Extract metadata from media files
 * @param {Object} file - File object or file entry
 * @returns {Object} File with extracted metadata
 */
export async function extractMetadata(file) {
    const metadata = {
        ...file,
        artist: file.artist || 'Unknown Artist',
        album: file.album || 'Unknown Album',
        duration: file.duration || null,
        bitrate: null,
        thumbnail: file.thumbnail || null,
    };

    try {
        // Only attempt extraction if we have a real file object/handle
        const hasFileData = file.handle || file instanceof File || file instanceof Blob;

        if (!hasFileData) return metadata;

        // For audio files, try to extract basic info if not already present
        if (file.type === 'audio' && (metadata.artist === 'Unknown Artist')) {
            // Extract basic info from file name
            const nameWithoutExt = (file.title || file.name || '').replace(/\.[^.]+$/, '');
            const parts = nameWithoutExt.split(' - ');
            if (parts.length >= 2) {
                metadata.artist = parts[0].trim();
                metadata.title = parts[1].trim();
            }
        }

        // For video files, extract thumbnail if not already present
        if (file.type === 'video' && !metadata.thumbnail) {
            metadata.thumbnail = await generateVideoThumbnail(file);
        }
    } catch (err) {
        console.warn('Error extracting metadata:', err.message);
    }

    return metadata;
}

/**
 * Generate thumbnail from video file
 * @param {Object} file - Video file object or entry with handle
 * @returns {Promise<string>} Data URL of thumbnail
 */
export async function generateVideoThumbnail(file) {
    let url = null;
    try {
        url = await getLocalFileURL(file);
        if (!url) return null;

        const video = document.createElement('video');
        video.src = url;
        video.muted = true;
        video.preload = 'metadata';

        return new Promise((resolve) => {
            const cleanup = () => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            };

            video.addEventListener('loadedmetadata', () => {
                // Seek to 10% or 5 seconds, whichever is smaller
                video.currentTime = Math.min(video.duration * 0.1, 5);
            });

            video.addEventListener('seeked', () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth || 320;
                    canvas.height = video.videoHeight || 180;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    cleanup();
                    resolve(dataUrl);
                } catch (err) {
                    cleanup();
                    resolve(null);
                }
            });

            video.addEventListener('error', () => {
                cleanup();
                resolve(null);
            });

            // Fallback timeout
            setTimeout(() => {
                cleanup();
                resolve(null);
            }, 5000);
        });
    } catch (err) {
        console.warn('Error generating thumbnail:', err.message);
        return null;
    }
}

// getLocalFileURL is now imported from localStorageUtils

/**
 * Search files by query
 * @param {Array} files - Array of media files
 * @param {string} query - Search query
 * @returns {Array} Filtered files
 */
export function searchFiles(files, query) {
    if (!query.trim()) return files;

    const lowerQuery = query.toLowerCase();
    return files.filter(file =>
        file.title?.toLowerCase().includes(lowerQuery) ||
        file.artist?.toLowerCase().includes(lowerQuery) ||
        file.album?.toLowerCase().includes(lowerQuery) ||
        file.name?.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Sort files by various criteria
 * @param {Array} files - Array of media files
 * @param {string} sortBy - Sort key (name, date, size, artist, album)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted files
 */
export function sortFiles(files, sortBy = 'name', order = 'asc') {
    const sorted = [...files].sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
            case 'name':
                aVal = a.title?.toLowerCase() || a.name?.toLowerCase();
                bVal = b.title?.toLowerCase() || b.name?.toLowerCase();
                break;
            case 'date':
                aVal = a.lastModified || 0;
                bVal = b.lastModified || 0;
                break;
            case 'size':
                aVal = a.size || 0;
                bVal = b.size || 0;
                break;
            case 'artist':
                aVal = a.artist?.toLowerCase() || 'unknown';
                bVal = b.artist?.toLowerCase() || 'unknown';
                break;
            case 'album':
                aVal = a.album?.toLowerCase() || 'unknown';
                bVal = b.album?.toLowerCase() || 'unknown';
                break;
            default:
                aVal = a.title?.toLowerCase();
                bVal = b.title?.toLowerCase();
        }

        if (typeof aVal === 'string') {
            return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
}

/**
 * Group files by criteria
 * @param {Array} files - Array of media files
 * @param {string} groupBy - Grouping key (type, artist, album, folder)
 * @returns {Object} Grouped files
 */
export function groupFiles(files, groupBy = 'type') {
    const grouped = {};

    files.forEach(file => {
        let key;

        switch (groupBy) {
            case 'type':
                key = file.type === 'video' ? 'Videos' : 'Music';
                break;
            case 'artist':
                key = file.artist || 'Unknown Artist';
                break;
            case 'album':
                key = file.album || 'Unknown Album';
                break;
            case 'folder':
                key = file.folder || 'Other';
                break;
            default:
                key = 'All';
        }

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(file);
    });

    return grouped;
}

/**
 * Filter files by type
 * @param {Array} files - Array of media files
 * @param {string} type - File type (all, video, audio)
 * @returns {Array} Filtered files
 */
export function filterByType(files, type = 'all') {
    if (type === 'all') return files;
    return files.filter(file => file.type === type);
}

/**
 * Get file statistics
 * @param {Array} files - Array of media files
 * @returns {Object} Statistics
 */
export function getFileStats(files) {
    return {
        total: files.length,
        videos: files.filter(f => f.type === 'video').length,
        audio: files.filter(f => f.type === 'audio').length,
        totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
        totalSizeFormatted: formatFileSize(files.reduce((sum, f) => sum + (f.size || 0), 0)),
        artists: new Set(files.map(f => f.artist).filter(Boolean)).size,
        albums: new Set(files.map(f => f.album).filter(Boolean)).size,
    };
}

/**
 * Process files with full metadata
 * @param {Array} files - Array of media files
 * @returns {Promise<Array>} Files with metadata
 */
export async function processFilesWithMetadata(files) {
    const processed = [];

    for (const file of files) {
        try {
            const fileWithMetadata = await extractMetadata(file);
            processed.push(fileWithMetadata);
        } catch (err) {
            console.warn('Error processing file:', file.name, err.message);
            processed.push(file); // Add file even if metadata extraction fails
        }
    }

    return processed;
}

/**
 * Get files matching all filters
 * @param {Array} files - Array of media files
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered and sorted files
 */
export function applyFilters(files, filters = {}) {
    let result = files;

    // Apply type filter
    if (filters.filterType && filters.filterType !== 'all') {
        result = filterByType(result, filters.filterType);
    }

    // Apply search
    if (filters.searchQuery) {
        result = searchFiles(result, filters.searchQuery);
    }

    // Apply sorting
    if (filters.sortBy) {
        result = sortFiles(result, filters.sortBy, filters.sortOrder || 'asc');
    }

    return result;
}

/**
 * Create file categories for organization
 * @param {Array} files - Array of media files
 * @returns {Object} Categorized files
 */
export function categorizeFiles(files) {
    return {
        recent: files.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0)).slice(0, 20),
        videos: files.filter(f => f.type === 'video').sort((a, b) => a.title?.localeCompare(b.title)),
        audio: files.filter(f => f.type === 'audio').sort((a, b) => a.title?.localeCompare(b.title)),
        byArtist: groupFiles(files.filter(f => f.type === 'audio'), 'artist'),
        byFolder: groupFiles(files, 'folder'),
    };
}

/**
 * Watch for file changes (simulated with interval checks)
 * @param {Function} callback - Function to call when files change
 * @param {number} interval - Check interval in ms
 * @returns {number} Interval ID for cleanup
 */
export function watchFileChanges(callback, interval = 30000) {
    return setInterval(() => {
        callback();
    }, interval);
}

/**
 * Stop watching file changes
 * @param {number} intervalId - Interval ID from watchFileChanges
 */
export function stopWatchingFiles(intervalId) {
    if (intervalId) {
        clearInterval(intervalId);
    }
}
