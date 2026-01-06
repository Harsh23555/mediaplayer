import React from 'react';
import { Plus, ListMusic } from 'lucide-react';
import { useSelector } from 'react-redux';

const Playlists = () => {
    const { playlists } = useSelector((state) => state.playlist);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Playlists
                </h1>
                <button className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Playlist
                </button>
            </div>

            {/* Playlists Grid */}
            {playlists.length === 0 ? (
                <div className="card p-12">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center">
                            <ListMusic className="w-12 h-12" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No playlists yet
                        </h3>
                        <p className="mb-6">Create your first playlist to organize your media</p>
                        <button className="btn btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Playlist
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="card card-hover p-4 cursor-pointer">
                            <div className="aspect-square bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-4 flex items-center justify-center">
                                <ListMusic className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {playlist.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {playlist.items?.length || 0} items
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Playlists;
