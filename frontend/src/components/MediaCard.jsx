import React, { useState } from 'react';
import { Music, Video, Play, Trash2, Clock, User, Plus, Loader, Info } from 'lucide-react';
import { formatFileSize, formatTime } from '../utils/helpers';
import AddToPlaylistModal from './AddToPlaylistModal';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const MediaCard = ({ file, viewMode = 'grid', onPlay, onDelete }) => {
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);

    const getThumbnailUrl = () => {
        if (!file.thumbnail) return null;
        if (file.thumbnail.startsWith('http')) return file.thumbnail;
        return `${SERVER_URL}${file.thumbnail}`;
    };

    const thumbnailUrl = getThumbnailUrl();

    // Parse metadata if it's a string (SQLite)
    let parsedMetadata = {};
    try {
        parsedMetadata = typeof file.metadata === 'string'
            ? (JSON.parse(file.metadata) || {})
            : (file.metadata || {});
    } catch (e) {
        console.error('Failed to parse metadata for file:', file.id, e);
        parsedMetadata = {};
    }

    const artist = parsedMetadata.artist || null;
    const isLocal = file.id?.startsWith?.('local_');
    const isProcessing = file.status === 'processing';
    const hasError = file.status === 'error';

    const getCategoryLabel = () => {
        if (!file.category) return null;
        return file.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    const categoryLabel = getCategoryLabel();

    if (viewMode === 'list') {
        return (
            <div className="card p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                        {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : file.type === 'video' ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Music className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-100 truncate">{file.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                {file.type === 'video' ? <Video className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                                {file.type === 'video' ? 'Video' : 'Audio'}
                            </span>
                            {file.duration > 0 && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(file.duration)}
                                </span>
                            )}
                            {artist && (
                                <span className="flex items-center gap-1 truncate max-w-[150px]">
                                    <User className="w-3 h-3" />
                                    {artist}
                                </span>
                            )}
                            <span>{formatFileSize(file.size)}</span>
                            {categoryLabel && (
                                <span className="bg-primary-900/30 text-primary-400 px-1.5 py-0.5 rounded border border-primary-500/20">
                                    {categoryLabel}
                                </span>
                            )}
                            {isProcessing && (
                                <span className="flex items-center gap-1 text-yellow-500 animate-pulse">
                                    <Loader className="w-3 h-3 animate-spin" />
                                    Processing...
                                </span>
                            )}
                            {hasError && (
                                <span className="flex items-center gap-1 text-red-500">
                                    <Info className="w-3 h-3" />
                                    Error
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <button
                        onClick={() => onPlay(file)}
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Play
                    </button>
                    {!isLocal && (
                        <button
                            onClick={() => setShowPlaylistModal(true)}
                            className="p-2 hover:bg-primary-600/20 rounded transition-colors text-primary-400 hover:text-primary-300"
                            title="Add to Playlist"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(file.id)}
                        className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <AddToPlaylistModal
                    isOpen={showPlaylistModal}
                    onClose={() => setShowPlaylistModal(false)}
                    mediaId={file.id}
                    mediaTitle={file.title}
                    mediaType={file.type}
                />
            </div>
        );
    }

    // Grid view
    return (
        <div className="group relative">
            <div className="card p-4 hover:shadow-lg transition-all cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-xl">
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : file.type === 'video' ? (
                        <Video className="w-8 h-8 text-white" />
                    ) : (
                        <Music className="w-8 h-8 text-white" />
                    )}

                    {file.duration > 0 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                            {formatTime(file.duration)}
                        </div>
                    )}

                    {categoryLabel && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary-600/80 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                            {categoryLabel}
                        </div>
                    )}

                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <Loader className="w-10 h-10 text-primary-400 animate-spin" />
                            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest animate-pulse">Processing</span>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all gap-2">
                        <button
                            onClick={() => onPlay(file)}
                            className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                        >
                            <Play className="w-6 h-6 text-white fill-white" />
                        </button>
                        {!isLocal && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowPlaylistModal(true); }}
                                className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                                title="Add to Playlist"
                            >
                                <Plus className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>
                </div>
                <h3 className="font-bold text-gray-100 truncate text-sm">
                    {file.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-gray-500 truncate max-w-[70%]">
                        {artist || formatFileSize(file.size)}
                    </p>
                    {artist && (
                        <p className="text-[11px] text-gray-600">
                            {formatFileSize(file.size)}
                        </p>
                    )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
            </div>

            <AddToPlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                mediaId={file.id}
                mediaTitle={file.title}
                mediaType={file.type}
            />
        </div>
    );
};

export default MediaCard;
