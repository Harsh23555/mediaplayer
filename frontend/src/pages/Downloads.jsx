import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Download, Pause, Play, X, Trash2, Link as LinkIcon } from 'lucide-react';
import { pauseDownload, resumeDownload, cancelDownload, removeDownload } from '../store/slices/downloadSlice';
import { formatFileSize } from '../utils/helpers';

const Downloads = () => {
    const dispatch = useDispatch();
    const { downloads } = useSelector((state) => state.downloads);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [quality, setQuality] = useState('1080p');

    const handleAddDownload = (e) => {
        e.preventDefault();
        // Implement download initiation
        console.log('Adding download:', downloadUrl, quality);
        setShowAddDialog(false);
        setDownloadUrl('');
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Downloads
                </h1>
                <button
                    onClick={() => setShowAddDialog(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    New Download
                </button>
            </div>

            {/* Add Download Dialog */}
            {showAddDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>No downloads yet</p>
                        <p className="text-sm mt-2">Click "New Download" to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {downloads.map((download) => (
                            <div
                                key={download.id}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg"
                            >
                                {/* Icon */}
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
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
                                            onClick={() => dispatch(pauseDownload(download.id))}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg"
                                        >
                                            <Pause className="w-5 h-5" />
                                        </button>
                                    )}
                                    {download.status === 'paused' && (
                                        <button
                                            onClick={() => dispatch(resumeDownload(download.id))}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg"
                                        >
                                            <Play className="w-5 h-5" />
                                        </button>
                                    )}
                                    {(download.status === 'downloading' || download.status === 'paused') && (
                                        <button
                                            onClick={() => dispatch(cancelDownload(download.id))}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-red-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                    {(download.status === 'completed' || download.status === 'failed' || download.status === 'cancelled') && (
                                        <button
                                            onClick={() => dispatch(removeDownload(download.id))}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-red-600"
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
