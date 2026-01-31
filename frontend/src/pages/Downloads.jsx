import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Pause, Play, X, Trash2, Link as LinkIcon, Video, Music } from 'lucide-react';
import { setDownloads, addDownload, pauseDownload, resumeDownload, cancelDownload, removeDownload } from '../store/slices/downloadSlice';
import { setPlaying } from '../store/slices/playerSlice';
import { setQueue, setCurrentIndex } from '../store/slices/playlistSlice';
import { formatFileSize } from '../utils/helpers';
import { downloadAPI } from '../utils/api';

const Downloads = () => {
    const dispatch = useDispatch();
    const { downloads } = useSelector((state) => state.downloads);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [quality, setQuality] = useState('1080p');

    const location = useLocation();
    const navigate = useNavigate();

    const fetchDownloads = async () => {
        try {
            const { data } = await downloadAPI.getAll();
            dispatch(setDownloads(data));
        } catch (error) {
            console.error('Failed to fetch downloads:', error);
        }
    };

    useEffect(() => {
        fetchDownloads();

        // Poll for updates every 3 seconds
        const interval = setInterval(fetchDownloads, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (location.state?.openAddDialog) {
            setShowAddDialog(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleAddDownload = async (e) => {
        e.preventDefault();
        try {
            // Determine type based on quality selection
            const downloadType = quality === 'audio' ? 'audio' : 'video';

            const { data } = await downloadAPI.initiate({
                url: downloadUrl,
                quality,
                type: downloadType
            });

            // Refresh the list immediately
            fetchDownloads();

            setShowAddDialog(false);
            setDownloadUrl('');
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to start download: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleClearCompleted = async () => {
        const completedDownloads = downloads.filter(d => d.status === 'completed' || d.status === 'failed' || d.status === 'cancelled');
        if (completedDownloads.length === 0) return;

        if (!confirm(`Are you sure you want to clear ${completedDownloads.length} finished downloads?`)) return;

        try {
            for (const d of completedDownloads) {
                await downloadAPI.remove(d.id);
            }
            fetchDownloads();
        } catch (error) {
            console.error('Failed to clear downloads:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'downloading':
                return 'text-blue-600 dark:text-blue-400';
            case 'completed':
                return 'text-green-600 dark:text-green-400';
            case 'paused':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'failed':
            case 'cancelled':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">
                        Downloads
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Files are saved to your system's <span className="text-primary-400">Downloads/MediaPlayer</span> folder
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {downloads.some(d => d.status === 'completed' || d.status === 'failed' || d.status === 'cancelled') && (
                        <button
                            onClick={handleClearCompleted}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Finished
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddDialog(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        New Download
                    </button>
                </div>
            </div>

            {/* Add Download Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-100">
                                Add Download
                            </h2>
                            <button
                                onClick={() => setShowAddDialog(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDownload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Video/Audio URL
                                </label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="url"
                                        value={downloadUrl}
                                        onChange={(e) => setDownloadUrl(e.target.value)}
                                        placeholder="https://example.com/video"
                                        className="input pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quality
                                </label>
                                <select
                                    value={quality}
                                    onChange={(e) => setQuality(e.target.value)}
                                    className="input"
                                >
                                    <option value="4k">4K (2160p)</option>
                                    <option value="1080p">Full HD (1080p)</option>
                                    <option value="720p">HD (720p)</option>
                                    <option value="480p">SD (480p)</option>
                                    <option value="audio">Audio Only</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button type="submit" className="btn btn-primary flex-1">
                                    Start Download
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddDialog(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Downloads List */}
            <div className="card p-6">
                {downloads.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Download className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-gray-100">No downloads yet</p>
                        <p className="text-sm mt-2 text-gray-400">Click "New Download" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {downloads.map((download) => (
                            <div
                                key={download.id}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/5"
                            >
                                {/* Icon */}
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {download.type === 'video' ? (
                                        <Video className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    ) : (
                                        <Music className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-100 truncate">
                                        {download.title || download.url}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm">
                                        <span className={`font-medium ${getStatusColor(download.status)}`}>
                                            {download.status}
                                        </span>
                                        {download.size && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {formatFileSize(download.size)}
                                            </span>
                                        )}
                                        {download.progress > 0 && download.status === 'downloading' && (
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {download.progress}%
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    {download.status === 'downloading' && (
                                        <div className="download-progress mt-2">
                                            <div
                                                className="download-progress-bar"
                                                style={{ width: `${download.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {download.status === 'downloading' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await downloadAPI.pause(download.id);
                                                    fetchDownloads();
                                                } catch (err) {
                                                    console.error('Failed to pause:', err);
                                                }
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg"
                                        >
                                            <Pause className="w-5 h-5" />
                                        </button>
                                    )}
                                    {download.status === 'paused' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await downloadAPI.resume(download.id);
                                                    fetchDownloads();
                                                } catch (err) {
                                                    console.error('Failed to resume:', err);
                                                }
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg"
                                        >
                                            <Play className="w-5 h-5" />
                                        </button>
                                    )}
                                    {(download.status === 'downloading' || download.status === 'paused') && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await downloadAPI.remove(download.id);
                                                    fetchDownloads();
                                                } catch (err) {
                                                    console.error('Failed to cancel:', err);
                                                }
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                    {download.status === 'completed' && download.mediaId && (
                                        <button
                                            onClick={() => {
                                                dispatch(setPlaying(true));
                                                navigate(`/player/${download.mediaId}`);
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-primary-600 dark:text-primary-400"
                                            title="Play"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                        </button>
                                    )}
                                    {(download.status === 'completed' || download.status === 'failed' || download.status === 'cancelled') && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await downloadAPI.remove(download.id);
                                                    dispatch(removeDownload(download.id));
                                                } catch (err) {
                                                    console.error('Failed to remove download:', err);
                                                    alert('Failed to remove download: ' + (err.response?.data?.error || err.message));
                                                }
                                            }}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-red-600"
                                            title="Remove"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Downloads;
