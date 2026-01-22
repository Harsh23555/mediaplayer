import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Music, Video, Grid, List, Search, ArrowUpDown, RefreshCw, AlertCircle, FolderOpen, Play, Trash2, X, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import { mediaAPI } from '../utils/api';
import { getLocalFileURL, formatFileSize } from '../utils/localStorageUtils';
import VideoUploader from '../components/upload/VideoUploader';
import LocalVideoPlayer from '../components/LocalVideoPlayer';
import {
    setLocalFiles,
    setSearchQuery,
    setFilterType,
    setSortBy,
    toggleSortOrder,
    setGroupBy,
    setAutoRefresh
} from '../store/slices/localStorageSlice';
import {
    applyFilters,
    groupFiles,
    getFileStats,
    processFilesWithMetadata,
    watchFileChanges,
    stopWatchingFiles
} from '../utils/mediaAdvancedUtils';

const LibraryEnhanced = () => {
    const dispatch = useDispatch();
    const [viewMode, setViewMode] = useState('grid');
    const [loading, setLoading] = useState(false);
    const [playingFile, setPlayingFile] = useState(null);
    const [watchInterval, setWatchInterval] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [uploadMessage, setUploadMessage] = useState(null);

    const {
        permission,
        localFiles,
        searchQuery,
        filterType,
        sortBy,
        sortOrder,
        groupBy,
        autoRefresh
    } = useSelector((state) => state.localStorage);

    // Setup auto-refresh
    useEffect(() => {
        if (autoRefresh && permission.granted) {
            const interval = watchFileChanges(() => {
                handleRefresh();
            }, 30000);
            setWatchInterval(interval);
            return () => {
                if (interval) stopWatchingFiles(interval);
            };
        }
    }, [autoRefresh, permission.granted]);

    // Get filtered and sorted media
    const filteredLocal = applyFilters(localFiles, {
        filterType,
        searchQuery,
        sortBy,
        sortOrder
    });

    // Group files
    const groupedFiles = groupBy !== 'type' && filteredLocal.length > 0
        ? groupFiles(filteredLocal, groupBy)
        : null;

    // Get statistics
    const stats = getFileStats(localFiles);

    const handlePlayLocal = async (file) => {
        try {
            const url = await getLocalFileURL(file);
            setPlayingFile({ ...file, url });
            console.log('Playing local file:', file.name, url);
        } catch (err) {
            alert('Error playing file: ' + err.message);
        }
    };

    const handleDeleteLocal = (fileId) => {
        const updatedFiles = localFiles.filter(f => f.id !== fileId);
        dispatch(setLocalFiles(updatedFiles));
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const processedFiles = await processFilesWithMetadata(localFiles);
            dispatch(setLocalFiles(processedFiles));
        } catch (err) {
            console.error('Error refreshing files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSuccess = (result) => {
        setShowUploader(false);
        const message = `✅ Upload Complete: ${result.successful}/${result.total} files uploaded`;
        setUploadMessage(message);

        // Clear message after 3 seconds
        setTimeout(() => setUploadMessage(null), 3000);

        // Refresh the library after upload
        setTimeout(() => {
            handleRefresh();
        }, 500);
    };

    const renderFile = (file, isGridView = true) => {
        if (isGridView) {
            return (
                <div key={file.id} className="group relative">
                    <div className="card p-4 hover:shadow-lg transition-all cursor-pointer">
                        {file.thumbnail ? (
                            <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden relative">
                                <img src={file.thumbnail} alt={file.title} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handlePlayLocal(file)}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </button>
                            </div>
                        ) : (
                            <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-xl">
                                {file.type === 'video' ? (
                                    <Video className="w-10 h-10 text-red-400" />
                                ) : file.type === 'audio' ? (
                                    <Music className="w-10 h-10 text-blue-400" />
                                ) : file.type === 'image' ? (
                                    <ImageIcon className="w-10 h-10 text-green-400" />
                                ) : (
                                    <FileText className="w-10 h-10 text-gray-400" />
                                )}

                                <button
                                    onClick={() => handlePlayLocal(file)}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Play className="w-8 h-8 text-white fill-white" />
                                </button>
                            </div>
                        )}
                        <h3 className="font-medium text-gray-100 truncate text-sm">{file.title}</h3>
                        {file.artist && file.artist !== 'Unknown Artist' && (
                            <p className="text-xs text-gray-400 truncate">{file.artist}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                        <button
                            onClick={() => handleDeleteLocal(file.id)}
                            className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                        >
                            <Trash2 className="w-3 h-3 text-white" />
                        </button>
                    </div>
                </div>
            );
        }

        // List view
        return (
            <div key={file.id} className="card p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded p-2 flex-shrink-0">
                        {file.type === 'video' ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Music className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-100 truncate">{file.title}</h3>
                        <p className="text-sm text-gray-500 truncate">
                            {file.artist ? `${file.artist}` : ''}
                            {file.artist && file.album ? ' • ' : ''}
                            {file.album ? `${file.album}` : ''}
                            {(file.artist || file.album) ? ' • ' : ''}
                            {formatFileSize(file.size)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                        onClick={() => handlePlayLocal(file)}
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Play
                    </button>
                    <button
                        onClick={() => handleDeleteLocal(file.id)}
                        className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Upload Message */}
            {uploadMessage && (
                <div className="card bg-green-900/30 border border-green-700 p-4 flex items-center justify-between">
                    <span className="text-green-200">{uploadMessage}</span>
                    <button onClick={() => setUploadMessage(null)} className="text-green-200 hover:text-green-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-100">Media Library</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowUploader(true)}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                        title="Upload videos and music"
                    >
                        <Upload className="w-4 h-4" />
                        Upload
                    </button>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="btn btn-secondary btn-sm"
                        title="Show statistics"
                    >
                        📊 {stats.total}
                    </button>
                </div>
            </div>

            {/* Video Uploader Modal */}
            <VideoUploader
                isOpen={showUploader}
                onClose={() => setShowUploader(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            {/* Statistics */}
            {showStats && (
                <div className="card p-4 grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
                        <div className="text-xs text-gray-400">Total Files</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.videos}</div>
                        <div className="text-xs text-gray-400">Videos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.audio}</div>
                        <div className="text-xs text-gray-400">Audio Files</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">{stats.artists}</div>
                        <div className="text-xs text-gray-400">Artists</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-pink-400">{stats.albums}</div>
                        <div className="text-xs text-gray-400">Albums</div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-orange-400">{stats.totalSizeFormatted}</div>
                        <div className="text-xs text-gray-400">Total Size</div>
                    </div>
                </div>
            )}

            {/* Permission Notice */}
            {!permission.granted && (
                <div className="card bg-yellow-900/20 border border-yellow-800 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-200">Local Storage Permission Required</h3>
                            <p className="text-sm text-yellow-100 mt-1">
                                Go to <strong>Settings</strong> to grant permission and access local media files.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Controls */}
            {permission.granted && localFiles.length > 0 && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title, artist, or album..."
                            value={searchQuery}
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            className="input pl-10 w-full"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => dispatch(setSearchQuery(''))}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => dispatch(setFilterType(e.target.value))}
                            className="input py-2 text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="video">Videos</option>
                            <option value="audio">Music</option>
                            <option value="image">Images</option>
                            <option value="document">Documents</option>
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => dispatch(setSortBy(e.target.value))}
                            className="input py-2 text-sm"
                        >
                            <option value="name">Sort: Name</option>
                            <option value="date">Sort: Date</option>
                            <option value="size">Sort: Size</option>
                            <option value="artist">Sort: Artist</option>
                            <option value="album">Sort: Album</option>
                        </select>

                        {/* Sort Order */}
                        <button
                            onClick={() => dispatch(toggleSortOrder())}
                            className="btn btn-secondary btn-sm flex items-center gap-1"
                            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        >
                            <ArrowUpDown className="w-4 h-4" />
                            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                        </button>

                        {/* Group By */}
                        <select
                            value={groupBy}
                            onChange={(e) => dispatch(setGroupBy(e.target.value))}
                            className="input py-2 text-sm"
                        >
                            <option value="type">Group: Type</option>
                            <option value="artist">Group: Artist</option>
                            <option value="album">Group: Album</option>
                            <option value="folder">Group: Folder</option>
                        </select>

                        {/* View Mode */}
                        <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1 ml-auto">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-600' : 'hover:bg-gray-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="btn btn-secondary btn-sm"
                            title="Refresh and extract metadata"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Auto Refresh Toggle */}
                        <button
                            onClick={() => dispatch(setAutoRefresh(!autoRefresh))}
                            className={`btn btn-sm ${autoRefresh ? 'bg-green-600' : 'btn-secondary'}`}
                            title="Toggle auto-refresh every 30 seconds"
                        >
                            {autoRefresh ? '🔄 Auto' : '⏸ Manual'}
                        </button>
                    </div>
                </div>
            )}

            {/* Files Display */}
            {permission.granted && localFiles.length > 0 ? (
                <div>
                    <h2 className="text-lg font-semibold text-gray-100 mb-4">
                        <FolderOpen className="inline w-5 h-5 mr-2" />
                        {filteredLocal.length} of {localFiles.length} Files
                    </h2>

                    {filteredLocal.length > 0 ? (
                        groupedFiles ? (
                            // Grouped View
                            <div className="space-y-6">
                                {Object.entries(groupedFiles).map(([groupName, files]) => (
                                    <div key={groupName}>
                                        <h3 className="text-base font-semibold text-gray-200 mb-3 p-2 bg-gray-800/50 rounded">
                                            {groupName} ({files.length})
                                        </h3>
                                        {viewMode === 'grid' ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {files.map(file => renderFile(file, true))}
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {files.map(file => renderFile(file, false))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Non-grouped View
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredLocal.map(file => renderFile(file, true))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredLocal.map(file => renderFile(file, false))}
                                </div>
                            )
                        )
                    ) : (
                        <div className="card p-8 text-center text-gray-400">
                            <p>No files match your search criteria</p>
                        </div>
                    )}
                </div>
            ) : !permission.granted ? null : (
                // Empty state
                <div className="card p-12">
                    <div className="text-center text-gray-500">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                            <Music className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">No media files yet</h3>
                        <p className="text-gray-400 mb-6">
                            Grant permission in Settings to access local files, or upload media below.
                        </p>
                        <button
                            onClick={() => setShowUploader(true)}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            <Upload className="w-4 h-4 inline mr-2" />
                            Upload Media
                        </button>
                    </div>
                </div>
            )}

            {/* Local Video Player Modal */}
            {playingFile && (
                <LocalVideoPlayer
                    file={playingFile}
                    url={playingFile.url}
                    isAudio={playingFile.type === 'audio'}
                    onClose={() => setPlayingFile(null)}
                />
            )}
        </div>
    );
};

export default LibraryEnhanced;
