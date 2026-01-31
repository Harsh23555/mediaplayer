import React from 'react';
import { Play, Music, Video, TrendingUp } from 'lucide-react';

import { mediaAPI, playlistAPI, downloadAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToRecentlyPlayed, clearRecentlyPlayed } from '../store/slices/recentlyPlayedSlice';
import { setQueue, setCurrentIndex } from '../store/slices/playlistSlice';
import { setPlaying } from '../store/slices/playerSlice';
import { MediaCard } from '../components/MediaCard';

const Home = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items: recentlyPlayed } = useSelector(state => state.recentlyPlayed);
    const [counts, setCounts] = React.useState({
        media: 0,
        playlists: 0,
        downloads: 0,
        recentlyPlayed: 0
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const [mediaRes, playlistRes, downloadRes] = await Promise.all([
                    mediaAPI.getAll(),
                    playlistAPI.getAll(),
                    downloadAPI.getAll()
                ]);

                setCounts({
                    media: mediaRes.data?.data?.length || 0,
                    playlists: playlistRes.data?.length || 0,
                    downloads: downloadRes.data?.filter(d => d.status === 'completed').length || 0,
                    recentlyPlayed: recentlyPlayed.length
                });
            } catch (err) {
                console.error('Error fetching home stats:', err);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Total Media', value: counts.media.toString(), icon: Music, color: 'bg-accent-300' },
        { label: 'Playlists', value: counts.playlists.toString(), icon: Play, color: 'bg-accent-400' },
        { label: 'Downloads', value: counts.downloads.toString(), icon: Video, color: 'bg-accent-500' },
        { label: 'Recently Played', value: counts.recentlyPlayed.toString(), icon: TrendingUp, color: 'bg-accent-600' },
    ];

    const handleUploadClick = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;
            let successCount = 0;
            const fileArray = Array.from(files);

            for (const f of fileArray) {
                const formData = new FormData();
                formData.append('file', f); // Backend expects 'file'
                try {
                    await mediaAPI.upload(formData);
                    successCount++;
                } catch (err) {
                    // Enhanced error logging with more details
                    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                        console.error(`Failed to upload ${f.name}: Backend server is not running on port 5000`);
                    } else if (err.response?.status === 500) {
                        console.error(`Failed to upload ${f.name}: Server error (500)`, err.response?.data?.error);
                    } else if (err.response?.status === 400) {
                        console.error(`Failed to upload ${f.name}: Invalid file (400)`, err.response?.data?.error);
                    } else {
                        console.error(`Failed to upload ${f.name}:`, err.message || err);
                    }
                }
            }

            if (successCount > 0) {
                alert(`Successfully uploaded ${successCount} of ${fileArray.length} files`);
                // Trigger refresh if needed: window.location.reload(); or use a context
            } else if (fileArray.length > 0) {
                alert('Upload failed. Check the browser console for details. Make sure:\n1. Backend server is running on port 5000\n2. MongoDB is running\n3. File types are supported (mp4, webm, mkv, etc.)');
            }
        };
        input.click();
    };

    const goToCreatePlaylist = () => navigate('/playlists', { state: { openCreate: true } });
    const goToNewDownload = () => navigate('/downloads', { state: { openAddDialog: true } });

    return (
        <div className="space-y-6">
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
                                <p className="text-3xl font-bold text-gray-100">
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
                <h2 className="text-2xl font-bold text-gray-100 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleUploadClick} className="btn btn-secondary py-4">
                        <Music className="w-5 h-5 mr-2" />
                        Upload Media
                    </button>
                    <button onClick={goToCreatePlaylist} className="btn btn-secondary py-4">
                        <Play className="w-5 h-5 mr-2" />
                        Create Playlist
                    </button>
                    <button onClick={goToNewDownload} className="btn btn-secondary py-4">
                        <Video className="w-5 h-5 mr-2" />
                        Download Video
                    </button>
                </div>
            </div>

            {/* Recently Played */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-100">
                        Recently Played
                    </h2>
                    {recentlyPlayed.length > 0 && (
                        <button
                            onClick={() => dispatch(clearRecentlyPlayed())}
                            className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {recentlyPlayed.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {recentlyPlayed.map((item) => (
                            <MediaCard
                                key={item.id}
                                file={item}
                                onPlay={(file) => {
                                    dispatch(setQueue([file]));
                                    dispatch(setCurrentIndex(0));
                                    dispatch(setPlaying(true));
                                    navigate(`/player/${file.id}`);
                                }}
                                onDelete={() => { }} // Remove hide delete for recent?
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Music className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-gray-100 font-medium">No recently played media</p>
                        <p className="text-sm mt-2 text-gray-400">Start playing some music or videos!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
