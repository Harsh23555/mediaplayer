import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Filter, Grid, List, AlertCircle, FolderOpen } from 'lucide-react';
import { mediaAPI } from '../utils/api';
import { setLocalFiles } from '../store/slices/localStorageSlice';
import { setQueue, setCurrentIndex } from '../store/slices/playlistSlice';
import { setPlaying } from '../store/slices/playerSlice';
import VideoUploader from '../components/upload/VideoUploader';
import MediaCard from '../components/MediaCard';
import { getFileStats } from '../utils/mediaAdvancedUtils';
import { formatFileSize } from '../utils/localStorageUtils';

const Library = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid');
    const [filter, setFilter] = useState('all');
    const { permission, localFiles } = useSelector((state) => state.localStorage);
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showUploader, setShowUploader] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Fetch uploaded/downloaded media
    const fetchUploadedMedia = useCallback(async () => {
        try {
            const response = await mediaAPI.getAll();
            const files = (response.data?.data || []).map(file => ({
                ...file,
                source: 'uploaded',
                type: (file.type || 'video').toLowerCase(),
                metadata: typeof file.metadata === 'string' ? JSON.parse(file.metadata || '{}') : (file.metadata || {})
            }));
            setUploadedMedia(files);
        } catch (err) {
            console.error('Error fetching media:', err);
        }
    }, []);

    useEffect(() => {
        fetchUploadedMedia();
    }, [fetchUploadedMedia]);

    // Combined stats
    const allMedia = [...localFiles, ...uploadedMedia];
    const stats = getFileStats(allMedia);

    // Get filtered media
    const filteredLocal = filter === 'all' ? localFiles : localFiles.filter(file => file.type === filter);
    const filteredUploaded = filter === 'all' ? uploadedMedia : uploadedMedia.filter(file => file.type === filter);

    const handlePlay = (file, list) => {
        const index = list.findIndex(m => m.id === file.id);
        dispatch(setQueue(list));
        dispatch(setCurrentIndex(index !== -1 ? index : 0));
        dispatch(setPlaying(true));
        navigate(`/player/${file.id}`);
    };

    const handleDeleteLocal = (fileId) => {
        if (window.confirm('Remove this folder reference from your library?')) {
            const updatedFiles = localFiles.filter(f => f.id !== fileId);
            dispatch(setLocalFiles(updatedFiles));
        }
    };

    const handleDeleteUploaded = async (fileId) => {
        if (window.confirm('Are you sure you want to permanently delete this file?')) {
            try {
                await mediaAPI.delete(fileId);
                fetchUploadedMedia();
            } catch (err) {
                alert('Error deleting file: ' + err.message);
            }
        }
    };

    const handleUploadDefault = () => {
        setShowUploader(true);
    };

    const handleUploadSuccess = () => {
        setShowUploader(false);
        fetchUploadedMedia();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-100">
                    Media Library
                </h1>

                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="input py-2 pl-10 appearance-none bg-dark-800 border-white/10 text-gray-100"
                        >
                            <option value="all">All Media</option>
                            <option value="video">Videos</option>
                            <option value="audio">Music</option>
                        </select>
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${showStats ? 'bg-primary-600 border-primary-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        📊 {stats.total}
                    </button>
                </div>
            </div>

            {/* Statistics Section */}
            {showStats && (
                <div className="card p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-2xl font-bold text-primary-400">{stats.total}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Total Items</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-2xl font-bold text-blue-400">{stats.videos}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Videos</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-2xl font-bold text-green-400">{stats.audio}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Audio</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-2xl font-bold text-purple-400">{stats.artists}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Artists</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-2xl font-bold text-pink-400">{stats.albums}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Albums</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white/5">
                        <span className="text-sm font-bold text-orange-400">{stats.totalSizeFormatted}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Lib Size</span>
                    </div>
                </div>
            )}

            {/* Permission Notice */}
            {!permission.granted && (
                <div className="card bg-primary-900/10 border border-primary-500/20 p-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-100">Local Storage Access</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                Grant permission in <button onClick={() => navigate('/settings')} className="text-primary-400 hover:underline font-medium">Settings</button> to access your local media files and enjoy a complete library experience.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Local Files Section */}
            {permission.granted && localFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary-400" />
                            Local Directory ({filteredLocal.length})
                        </h2>
                    </div>

                    {filteredLocal.length > 0 ? (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "space-y-2"}>
                            {filteredLocal.map((file) => (
                                <MediaCard
                                    key={file.id}
                                    file={file}
                                    viewMode={viewMode}
                                    onPlay={() => handlePlay(file, filteredLocal)}
                                    onDelete={() => handleDeleteLocal(file.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center border-dashed border-white/10">
                            <p className="text-gray-500">No {filter === 'all' ? 'media' : filter} files found in your local folders.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded/Downloaded Files Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary-400" />
                        Library ({filteredUploaded.length})
                    </h2>
                    {filteredUploaded.length === 0 && (
                        <button
                            onClick={handleUploadDefault}
                            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
                        >
                            Upload Files
                        </button>
                    )}
                </div>

                {filteredUploaded.length > 0 ? (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "space-y-2"}>
                        {filteredUploaded.map((file) => (
                            <MediaCard
                                key={file.id}
                                file={file}
                                viewMode={viewMode}
                                onPlay={() => handlePlay(file, filteredUploaded)}
                                onDelete={() => handleDeleteUploaded(file.id)}
                            />
                        ))}
                    </div>
                ) : !permission.granted || localFiles.length === 0 ? (
                    <div className="card p-20 flex flex-col items-center justify-center border-dashed border-white/10 bg-white/[0.02]">
                        <div className="w-20 h-20 bg-primary-600/10 rounded-full flex items-center justify-center mb-6">
                            <FolderOpen className="w-10 h-10 text-primary-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-100 mb-2">Your library is empty</h3>
                        <p className="text-gray-400 text-center max-w-md mb-8">
                            Add media files from your computer or use our download tool to start building your collection.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleUploadDefault}
                                className="btn btn-primary px-8"
                            >
                                Upload Media
                            </button>
                            <button
                                onClick={() => navigate('/downloads', { state: { openAddDialog: true } })}
                                className="btn btn-secondary px-8"
                            >
                                Download Online
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card p-12 text-center border-dashed border-white/10">
                        <p className="text-gray-500">No {filter === 'all' ? 'media' : filter} files found in your library.</p>
                    </div>
                )}
            </div>

            <VideoUploader
                isOpen={showUploader}
                onClose={() => setShowUploader(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
};
export default Library;
