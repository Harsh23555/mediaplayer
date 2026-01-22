import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Plus,
    Trash2,
    Music,
    Video,
    Repeat,
    Repeat1,
    Shuffle,
    X,
} from 'lucide-react';
import { formatTime } from '../utils/helpers';

const PlaylistManager = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);

    const {
        queue,
        currentIndex,
        repeatMode, // 'none', 'all', 'one'
        shuffle,
    } = useSelector((state) => state.playlist);

    const {
        isPlaying,
        currentTime,
        duration,
    } = useSelector((state) => state.player);

    const filteredQueue = queue.filter((media) =>
        media.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === dropIndex) return;

        const newQueue = [...queue];
        const draggedMedia = newQueue[draggedItem];
        newQueue.splice(draggedItem, 1);
        newQueue.splice(dropIndex, 0, draggedMedia);

        // Dispatch reorder action to Redux
        // dispatch(reorderQueue(newQueue));
        setDraggedItem(null);
    };

    const getMediaIcon = (type) => {
        return type === 'video' ? (
            <Video className="w-4 h-4" />
        ) : (
            <Music className="w-4 h-4" />
        );
    };

    return (
        <div className={`playlist-manager ${isOpen ? 'open' : ''}`}>
            {/* Overlay */}
            <div className="playlist-overlay" onClick={onClose} />

            {/* Playlist Panel */}
            <div className="playlist-panel">
                {/* Header */}
                <div className="playlist-header">
                    <h2 className="text-xl font-bold text-white">
                        Now Playing Queue
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Queue Stats */}
                <div className="px-4 py-2 bg-slate-700/30 border-b border-slate-600">
                    <p className="text-sm text-gray-300">
                        {queue.length} item{queue.length !== 1 ? 's' : ''} in queue
                    </p>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-slate-600">
                    <input
                        type="text"
                        placeholder="Search playlist..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 text-white placeholder-gray-400 rounded border border-slate-600 focus:border-indigo-500 outline-none"
                    />
                </div>

                {/* Playlist Items */}
                <div className="playlist-items">
                    {filteredQueue.length === 0 ? (
                        <div className="empty-playlist">
                            <Music className="w-12 h-12 text-gray-500 mb-3" />
                            <p className="text-gray-400">
                                {searchTerm ? 'No matches found' : 'Queue is empty'}
                            </p>
                        </div>
                    ) : (
                        filteredQueue.map((media, index) => {
                            const actualIndex = queue.indexOf(media);
                            const isActive = actualIndex === currentIndex;

                            return (
                                <div
                                    key={media.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, actualIndex)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, actualIndex)}
                                    className={`playlist-item ${isActive ? 'active' : ''} ${
                                        draggedItem === actualIndex ? 'dragging' : ''
                                    }`}
                                >
                                    {/* Index */}
                                    <span className="playlist-index text-sm text-gray-400 w-6">
                                        {actualIndex + 1}
                                    </span>

                                    {/* Media Icon */}
                                    <span className="text-indigo-400">
                                        {getMediaIcon(media.type)}
                                    </span>

                                    {/* Media Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate text-sm">
                                            {media.title}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">
                                            {media.artist || 'Unknown Artist'}
                                        </p>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-gray-400 text-sm">
                                        {formatTime(media.duration)}
                                    </span>

                                    {/* Playing Badge */}
                                    {isActive && isPlaying && (
                                        <div className="playing-indicator ml-2" title="Now Playing">
                                            <span className="animate-pulse text-indigo-400">●</span>
                                        </div>
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        className="text-gray-400 hover:text-red-400 transition-colors ml-2 opacity-0 group-hover:opacity-100"
                                        title="Remove from queue"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Controls Footer */}
                <div className="playlist-footer border-t border-slate-600 p-4 space-y-3">
                    {/* Repeat Mode */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300 w-20">
                            Repeat:
                        </label>
                        <div className="flex gap-2">
                            <button
                                className={`px-3 py-1 rounded text-sm transition-all ${
                                    repeatMode === 'none'
                                        ? 'bg-slate-600 text-white'
                                        : 'bg-slate-700 text-gray-400 hover:text-white'
                                }`}
                                title="No repeat"
                            >
                                <Repeat className="w-4 h-4" />
                            </button>
                            <button
                                className={`px-3 py-1 rounded text-sm transition-all ${
                                    repeatMode === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-700 text-gray-400 hover:text-white'
                                }`}
                                title="Repeat all"
                            >
                                <Repeat className="w-4 h-4" />
                            </button>
                            <button
                                className={`px-3 py-1 rounded text-sm transition-all ${
                                    repeatMode === 'one'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-700 text-gray-400 hover:text-white'
                                }`}
                                title="Repeat one"
                            >
                                <Repeat1 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Shuffle */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-300 w-20">
                            Shuffle:
                        </label>
                        <button
                            className={`px-4 py-1 rounded text-sm transition-all flex items-center gap-2 ${
                                shuffle
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-700 text-gray-400 hover:text-white'
                            }`}
                            title="Toggle shuffle"
                        >
                            <Shuffle className="w-4 h-4" />
                            {shuffle ? 'On' : 'Off'}
                        </button>
                    </div>

                    {/* Total Duration */}
                    <div className="bg-slate-700/30 rounded p-3 text-sm">
                        <p className="text-gray-300">
                            Total Duration:{' '}
                            <span className="text-white font-semibold">
                                {formatTime(
                                    queue.reduce((sum, media) => sum + (media.duration || 0), 0)
                                )}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaylistManager;
