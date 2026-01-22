import React from 'react';
import { Music, Video, Play, Trash2 } from 'lucide-react';
import { formatFileSize } from '../utils/localStorageUtils';

export const MediaCard = ({ file, viewMode = 'grid', onPlay, onDelete }) => {
    if (viewMode === 'list') {
        return (
            <div className="card p-4 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded p-2">
                        {file.type === 'video' ? (
                            <Video className="w-5 h-5 text-white" />
                        ) : (
                            <Music className="w-5 h-5 text-white" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-100 truncate">{file.title}</h3>
                        <p className="text-sm text-gray-500 truncate">
                            {formatFileSize(file.size)} • {file.type === 'video' ? 'Video' : 'Audio'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <button
                        onClick={() => onPlay(file)}
                        className="btn btn-secondary btn-sm flex items-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Play
                    </button>
                    <button
                        onClick={() => onDelete(file.id)}
                        className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div className="group relative">
            <div className="card p-4 hover:shadow-lg transition-all cursor-pointer">
                <div className="aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:shadow-xl">
                    {file.type === 'video' ? (
                        <Video className="w-8 h-8 text-white" />
                    ) : (
                        <Music className="w-8 h-8 text-white" />
                    )}
                    <button
                        onClick={() => onPlay(file)}
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
                    onClick={() => onDelete(file.id)}
                    className="absolute top-2 right-2 p-1 bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                    <Trash2 className="w-3 h-3 text-white" />
                </button>
            </div>
        </div>
    );
};

export default MediaCard;
