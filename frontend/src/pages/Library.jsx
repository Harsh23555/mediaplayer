import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Music, Video, Grid, List, Filter, Play, Trash2, AlertCircle, FolderOpen } from 'lucide-react';
import { mediaAPI } from '../utils/api';
import { getLocalFileURL, revokeLocalFileURL, formatFileSize } from '../utils/localStorageUtils';
import { setLocalFiles } from '../store/slices/localStorageSlice';
import { setQueue, setCurrentIndex } from '../store/slices/playlistSlice';
import { setPlaying } from '../store/slices/playerSlice';
import VideoUploader from '../components/upload/VideoUploader';

const Library = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('grid');
    const [filter, setFilter] = useState('all');
    const { permission, localFiles } = useSelector((state) => state.localStorage);
    const [uploadedMedia, setUploadedMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [playingFile, setPlayingFile] = useState(null);
    const [showUploader, setShowUploader] = useState(false);

    // Fetch uploaded media
    const fetchUploadedMedia = useCallback(async () => {
        try {
            const response = await mediaAPI.getAll();
            const files = response.data.data.map(file => ({
                ...file,
                source: 'uploaded',
                // Ensure type matches filter expectations
                type: file.type.toLowerCase()
            }));
            setUploadedMedia(files);
        } catch (err) {
            console.error('Error fetching media:', err);
        }
    }, []);

    useEffect(() => {
        fetchUploadedMedia();
    }, [fetchUploadedMedia]);

    // Get filtered media
    const filteredLocal = filter === 'all' ? localFiles : localFiles.filter(file => file.type === filter);
    const filteredUploaded = filter === 'all' ? uploadedMedia : uploadedMedia.filter(file => file.type === filter);
    const allMedia = [...filteredLocal, ...filteredUploaded];

    const handlePlayLocal = (file) => {
        const index = allMedia.findIndex(m => m.id === file.id);
        dispatch(setQueue(allMedia));
        dispatch(setCurrentIndex(index !== -1 ? index : 0));
        dispatch(setPlaying(true));
        navigate(`/player/${file.id}`);
    };

    const handleDeleteLocal = (fileId) => {
        const updatedFiles = localFiles.filter(f => f.id !== fileId);
        dispatch(setLocalFiles(updatedFiles));
    };

    const handleDeleteUploaded = async (fileId) => {
        if (window.confirm('Are you sure you want to delete this uploaded file?')) {
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
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="input py-2"
                    >
                        <option value="all">All Media</option>
                        <option value="video">Videos</option>
                        <option value="audio">Music</option>
                    </select>

                    {/* View Mode */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid'
                                ? 'bg-white dark:bg-dark-600 shadow'
                                : 'hover:bg-gray-200 dark:hover:bg-dark-600'
                                }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list'
                                ? 'bg-white dark:bg-dark-600 shadow'
                                : 'hover:bg-gray-200 dark:hover:bg-dark-600'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Permission Notice */}
            {!permission.granted && (
                <div className="card bg-yellow-900/20 border border-yellow-800 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-200">Local Storage Permission Required</h3>
                            <p className="text-sm text-yellow-100 mt-1">
                                Go to <strong>Settings</strong> to grant permission and access your local media files (videos, audios, and music).
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Local Files Section */}
            {permission.granted && localFiles.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        Local Files ({filteredLocal.length})
                    </h2>
                    {filteredLocal.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredLocal.map((file) => (
                                    <div key={file.id} className="group relative">
                                        <div className="card p-4 hover:shadow-lg transition-all cursor-pointer">
                                            <div className="aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-xl">
                                                {file.type === 'video' ? (
                                                    <Video className="w-8 h-8 text-white" />
                                                ) : (
                                                    <Music className="w-8 h-8 text-white" />
                                                )}
                                                <button
                                                    onClick={() => handlePlayLocal(file)}
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Play className="w-8 h-8 text-white fill-white" />
                                                </button>
                                            </div>
                                            <h3 className="font-medium text-gray-100 truncate text-sm">
                                                {file.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatFileSize(file.size)}
                                            </p>
                                            <button
                                                onClick={() => handleDeleteLocal(file.id)}
                                                className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredLocal.map((file) => (
                                    <div key={file.id} className="card p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded p-2">
                                                {file.type === 'video' ? (
                                                    <Video className="w-5 h-5 text-white" />
                                                ) : (
                                                    <Music className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-100">{file.title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {formatFileSize(file.size)} • {file.type === 'video' ? 'Video' : 'Audio'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
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
                                ))}
                            </div>
                        )
                    ) : (
                        <div className="card p-8 text-center text-gray-400">
                            No {filter !== 'all' ? filter : 'media'} files found in selected folder
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {allMedia.length === 0 && (
                <div className="card p-12">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                            {filter === 'video' ? (
                                <Video className="w-12 h-12" />
                            ) : (
                                <Music className="w-12 h-12" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">
                            No media files yet
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {permission.granted
                                ? 'No media files found in your selected folder. Try selecting a different folder.'
                                : 'Grant permission in Settings to access local files, or upload media below.'}
                        </p>
                        <button
                            onClick={handleUploadDefault}
                            disabled={loading}
                            className="btn btn-secondary"
                        >
                            {loading ? 'Uploading...' : 'Upload Media'}
                        </button>
                    </div>
                </div>
            )}

            {/* Uploaded Files Section */}
            {filteredUploaded.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-400" />
                        Uploaded Files ({filteredUploaded.length})
                    </h2>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredUploaded.map((file) => (
                                <div key={file.id} className="group relative">
                                    <div className="card p-4 hover:shadow-lg transition-all cursor-pointer">
                                        <div className="aspect-square bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-xl">
                                            {file.type === 'video' ? (
                                                <Video className="w-8 h-8 text-white" />
                                            ) : (
                                                <Music className="w-8 h-8 text-white" />
                                            )}
                                            <button
                                                onClick={() => handlePlayLocal(file)}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Play className="w-8 h-8 text-white fill-white" />
                                            </button>
                                        </div>
                                        <h3 className="font-medium text-gray-100 truncate text-sm">
                                            {file.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatFileSize(file.size)}
                                        </p>
                                        <button
                                            onClick={() => handleDeleteUploaded(file.id)}
                                            className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredUploaded.map((file) => (
                                <div key={file.id} className="card p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded p-2">
                                            {file.type === 'video' ? (
                                                <Video className="w-5 h-5 text-white" />
                                            ) : (
                                                <Music className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-100">{file.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(file.size)} • {file.type === 'video' ? 'Video' : 'Audio'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePlayLocal(file)}
                                            className="btn btn-secondary btn-sm flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Play
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUploaded(file.id)}
                                            className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <VideoUploader
                isOpen={showUploader}
                onClose={() => setShowUploader(false)}
                onUploadSuccess={handleUploadSuccess}
            />

        </div>
    );
};

export default Library;
