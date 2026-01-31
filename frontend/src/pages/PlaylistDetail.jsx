import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Play,
    Trash2,
    ArrowLeft,
    Clock,
    Music,
    Video,
    ListMusic,
    Plus,
    MoreVertical,
    Shuffle,
    X,
    Search
} from 'lucide-react';
import { fetchPlaylists, removeMediaFromPlaylist, addMediaToPlaylist, setQueue, setCurrentIndex } from '../store/slices/playlistSlice';
import { setPlaying } from '../store/slices/playerSlice';
import { formatTime, formatFileSize } from '../utils/helpers';
import { mediaAPI } from '../utils/api';

const PlaylistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { playlists, loading } = useSelector((state) => state.playlist);
    const [playlist, setPlaylist] = useState(null);
    const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);
    const [libraryMedia, setLibraryMedia] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [discoveryLoading, setDiscoveryLoading] = useState(false);

    useEffect(() => {
        if (playlists.length === 0) {
            dispatch(fetchPlaylists());
        }
    }, [dispatch, playlists.length]);

    useEffect(() => {
        const found = playlists.find(p => p.id === id);
        if (found) {
            setPlaylist(found);
        }
    }, [id, playlists]);

    const handlePlayAll = () => {
        if (!playlist?.items?.length) return;
        const mediaItems = playlist.items.map(item => ({
            ...item.media,
            playlistItemId: item.id
        }));
        dispatch(setQueue(mediaItems));
        dispatch(setCurrentIndex(0));
        dispatch(setPlaying(true));
        navigate(`/player/${mediaItems[0].id}`);
    };

    const handleRemoveItem = async (itemId) => {
        if (window.confirm('Remove this item from the playlist?')) {
            try {
                await dispatch(removeMediaFromPlaylist({ playlistId: id, itemId })).unwrap();
            } catch (err) {
                alert('Failed to remove item: ' + err);
            }
        }
    };

    const handlePlayItem = (itemIndex) => {
        const mediaItems = playlist.items.map(item => ({
            ...item.media,
            playlistItemId: item.id
        }));
        dispatch(setQueue(mediaItems));
        dispatch(setCurrentIndex(itemIndex));
        dispatch(setPlaying(true));
        navigate(`/player/${mediaItems[itemIndex].id}`);
    };

    const fetchLibrary = async () => {
        setDiscoveryLoading(true);
        try {
            const response = await mediaAPI.getAll();
            setLibraryMedia(response.data.data);
        } catch (err) {
            console.error('Failed to fetch library:', err);
        } finally {
            setDiscoveryLoading(false);
        }
    };

    const handleAddToPlaylist = async (mediaId) => {
        try {
            await dispatch(addMediaToPlaylist({ playlistId: id, mediaId })).unwrap();
        } catch (err) {
            alert('Failed to add to playlist: ' + err);
        }
    };

    const filteredLibrary = libraryMedia.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !playlist?.items?.some(item => item.mediaId === m.id)
    );

    if (loading && !playlist) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Playlist not found</p>
                <button onClick={() => navigate('/playlists')} className="btn btn-secondary mt-4">
                    Back to Playlists
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
                <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-primary-600 to-indigo-900 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden relative group">
                    {playlist.items?.[0]?.media?.thumbnail ? (
                        <img
                            src={playlist.items[0].media.thumbnail.startsWith('http') ? playlist.items[0].media.thumbnail : `http://localhost:5000${playlist.items[0].media.thumbnail}`}
                            alt=""
                            className="w-full h-full object-cover opacity-80"
                        />
                    ) : (
                        <ListMusic className="w-24 h-24 text-white/40" />
                    )}
                    <button
                        onClick={handlePlayAll}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-8 h-8 text-white fill-current" />
                        </div>
                    </button>
                </div>

                <div className="flex-1 space-y-4">
                    <button
                        onClick={() => navigate('/playlists')}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Playlists
                    </button>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
                        {playlist.name}
                    </h1>
                    {playlist.description && (
                        <p className="text-lg text-gray-400 max-w-2xl">{playlist.description}</p>
                    )}
                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Collection</span>
                            <span className="text-sm font-bold text-gray-300">{playlist.items?.length || 0} Items</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Time</span>
                            <span className="text-sm font-bold text-gray-300">
                                {formatTime(playlist.items?.reduce((acc, item) => acc + (item.media?.duration || 0), 0) || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between py-4 border-y border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayAll}
                        disabled={!playlist.items?.length}
                        className="btn btn-primary px-8 py-3 rounded-full flex items-center gap-2 font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        <Play className="w-5 h-5 fill-current" />
                        Play Session
                    </button>
                    <button
                        onClick={() => {
                            setIsDiscoveryMode(!isDiscoveryMode);
                            if (!libraryMedia.length) fetchLibrary();
                        }}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all group ${isDiscoveryMode
                                ? 'bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/20'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        title={isDiscoveryMode ? "View Playlist" : "Add Media to Playlist"}
                    >
                        {isDiscoveryMode
                            ? <X className="w-6 h-6 text-white" />
                            : <Plus className="w-6 h-6 text-gray-400 group-hover:text-primary-400 group-hover:rotate-90 transition-all duration-300" />
                        }
                    </button>
                </div>

                {isDiscoveryMode && (
                    <div className="flex-1 max-w-sm ml-8 relative">
                        <input
                            type="text"
                            placeholder="Search library..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input w-full bg-white/5 border-white/10 py-3 pl-10 focus:border-primary-500 transition-all text-sm"
                            autoFocus
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                )}
            </div>

            {isDiscoveryMode ? (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Music className="w-5 h-5 text-primary-400" />
                            Add from Library
                        </h2>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{filteredLibrary.length} results</span>
                    </div>

                    {discoveryLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    ) : filteredLibrary.length === 0 ? (
                        <div className="card p-16 text-center border-dashed border-white/10 bg-white/[0.02]">
                            <p className="text-gray-500 italic">No media found in library to add.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredLibrary.map((media) => (
                                <div key={media.id} className="card p-3 flex items-center gap-3 bg-white/[0.03] hover:bg-white/5 transition-all border border-white/5 hover:border-primary-500/20 group">
                                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                                        {media.thumbnail ? (
                                            <img
                                                src={media.thumbnail.startsWith('http') ? media.thumbnail : `http://localhost:5000${media.thumbnail}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            media.type === 'video' ? <Video className="w-5 h-5 text-gray-600" /> : <Music className="w-5 h-5 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-gray-100 truncate group-hover:text-primary-400 transition-colors">{media.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 ${media.type === 'video' ? 'text-primary-400' : 'text-indigo-400'}`}>
                                                {media.type}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold">{formatTime(media.duration)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddToPlaylist(media.id)}
                                        className="w-10 h-10 rounded-full bg-primary-500/10 hover:bg-primary-500 text-primary-500 hover:text-white flex items-center justify-center transition-all group/btn"
                                    >
                                        <Plus className="w-5 h-5 group-active/btn:scale-90 transition-transform" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Items List */
                <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 bg-transparent">
                        <div className="col-span-1 text-center">#</div>
                        <div className="col-span-6 md:col-span-7">Title</div>
                        <div className="col-span-3 md:col-span-2 hidden md:block">Type</div>
                        <div className="col-span-2 text-right">Duration</div>
                    </div>

                    {playlist.items?.length === 0 ? (
                        <div className="py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-primary-600/10 rounded-full flex items-center justify-center mx-auto border border-primary-500/20">
                                <Music className="w-10 h-10 text-primary-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-gray-100">Your playlist is empty</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">Head to your Library or use the discovery mode above to add some media!</p>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => {
                                        setIsDiscoveryMode(true);
                                        fetchLibrary();
                                    }}
                                    className="btn btn-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Media Now
                                </button>
                                <button
                                    onClick={() => navigate('/library')}
                                    className="btn btn-secondary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs bg-white/5 border-white/10"
                                >
                                    Go to Library
                                </button>
                            </div>
                        </div>
                    ) : (
                        playlist.items.map((item, index) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-12 gap-4 px-4 py-3 rounded-xl hover:bg-white/5 group transition-all items-center border border-transparent hover:border-white/5"
                            >
                                <div className="col-span-1 text-center text-sm font-bold text-gray-500 group-hover:text-primary-400">
                                    {index + 1}
                                </div>

                                <div className="col-span-6 md:col-span-7 flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary-500/30 transition-colors">
                                        {item.media.thumbnail ? (
                                            <img
                                                src={item.media.thumbnail.startsWith('http') ? item.media.thumbnail : `http://localhost:5000${item.media.thumbnail}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            item.media.type === 'video' ? <Video className="w-5 h-5 text-gray-600" /> : <Music className="w-5 h-5 text-gray-600" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4
                                            onClick={() => handlePlayItem(index)}
                                            className="text-sm font-bold text-gray-100 truncate cursor-pointer hover:text-primary-400 transition-colors"
                                        >
                                            {item.media.title}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                                            {item.media.metadata?.artist || formatFileSize(item.media.size)}
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-3 md:col-span-2 hidden md:flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 ${item.media.type === 'video' ? 'text-primary-400 border-primary-500/20' : 'text-indigo-400 border-indigo-500/20'}`}>
                                        {item.media.type}
                                    </span>
                                </div>

                                <div className="col-span-2 flex items-center justify-end gap-3">
                                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-200 transition-colors">
                                        {formatTime(item.media.duration)}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Remove from Playlist"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PlaylistDetail;
