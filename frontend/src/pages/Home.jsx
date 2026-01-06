import React from 'react';
import { useSelector } from 'react-redux';
import { Play, Music, Video, TrendingUp } from 'lucide-react';
import MediaPlayerPro from '../components/MediaPlayerPro';

const Home = () => {
    const { theme } = useSelector((state) => state.theme);

    const stats = [
        { label: 'Total Media', value: '0', icon: Music, color: 'bg-blue-500' },
        { label: 'Playlists', value: '0', icon: Play, color: 'bg-purple-500' },
        { label: 'Downloads', value: '0', icon: Video, color: 'bg-green-500' },
        { label: 'Recently Played', value: '0', icon: TrendingUp, color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <MediaPlayerPro />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="card p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="btn btn-primary py-4">
                        <Music className="w-5 h-5 mr-2" />
                        Upload Media
                    </button>
                    <button className="btn btn-secondary py-4">
                        <Play className="w-5 h-5 mr-2" />
                        Create Playlist
                    </button>
                    <button className="btn btn-secondary py-4">
                        <Video className="w-5 h-5 mr-2" />
                        Download Video
                    </button>
                </div>
            </div>

            {/* Recently Played */}
            <div className="card p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Recently Played
                </h2>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No recently played media</p>
                    <p className="text-sm mt-2">Start playing some music or videos!</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
