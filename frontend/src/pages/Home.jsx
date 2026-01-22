import React from 'react';
import { Play, Music, Video, TrendingUp } from 'lucide-react';

import { mediaAPI, playlistAPI, downloadAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [counts, setCounts] = React.useState({
        media: 0,
        playlists: 0,
        downloads: 0,
        recentlyPlayed: 0
    });

    const navigate = useNavigate();

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
                    recentlyPlayed: 0 // Placeholder
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
                <h2 className="text-2xl font-bold text-gray-100 mb-4">
                    Recently Played
                </h2>
                <div className="text-center py-12 text-gray-400">
                    <Music className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-gray-100">No recently played media</p>
                    <p className="text-sm mt-2 text-gray-400">Start playing some music or videos!</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
