import React, { useState } from 'react';
import { Music, Video, Grid, List, Filter } from 'lucide-react';

const Library = () => {
    const [viewMode, setViewMode] = useState('grid');
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
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

            {/* Empty State */}
            <div className="card p-12">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                        {filter === 'video' ? (
                            <Video className="w-12 h-12" />
                        ) : (
                            <Music className="w-12 h-12" />
                        )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No media files yet
                    </h3>
                    <p className="mb-6">Upload your first media file to get started</p>
                    <button className="btn btn-primary">
                        Upload Media
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Library;
