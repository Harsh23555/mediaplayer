import React, { useState, useEffect } from 'react';
import { Plus, ListMusic, Trash2, Play, Calendar, Music as MusicIcon, MoreVertical, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../store/slices/playlistSlice';
import { formatDate } from '../utils/helpers';

const Playlists = () => {
    const { playlists, loading } = useSelector((state) => state.playlist);
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchPlaylists());
    }, [dispatch]);

    useEffect(() => {
        if (location.state?.openCreate) {
            setShowModal(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const openModal = () => setShowModal(true);
    const closeModal = () => {
        setShowModal(false);
        setName('');
        setDescription('');
    };

    const handleCreatePlaylist = async () => {
        const trimmed = name.trim();
        if (!trimmed) return alert('Please enter a playlist name');

        try {
            await dispatch(createPlaylist({ name: trimmed, description })).unwrap();
            closeModal();
        } catch (err) {
            alert('Failed to create playlist: ' + err);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this playlist?')) {
            try {
                await dispatch(deletePlaylist(id)).unwrap();
            } catch (err) {
                alert('Failed to delete playlist: ' + err);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-100">
                        Playlists
                    </h1>
                    <p className="text-gray-400 mt-1">Organize your favorite music and videos</p>
                </div>
                <button onClick={openModal} className="btn btn-primary flex items-center gap-2 px-6">
                    <Plus className="w-5 h-5" />
                    Create New
                </button>
            </div>

            {/* Playlists Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
            ) : playlists.length === 0 ? (
                <div className="card p-16 text-center border-dashed border-white/10 bg-white/[0.02]">
                    <div className="w-24 h-24 mx-auto mb-6 bg-primary-600/10 rounded-full flex items-center justify-center">
                        <ListMusic className="w-12 h-12 text-primary-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">
                        No playlists yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-sm mx-auto">Create your first playlist to organize your media files and enjoy custom collections.</p>
                    <button onClick={openModal} className="btn btn-primary px-8">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Playlist
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            onClick={() => navigate(`/playlists/${playlist.id}`)}
                            className="card group cursor-pointer overflow-hidden border border-white/5 hover:border-primary-500/30 transition-all duration-300"
                        >
                            <div className="aspect-video bg-gradient-to-br from-primary-600 to-indigo-700 relative flex items-center justify-center overflow-hidden">
                                {playlist.items?.[0]?.media?.thumbnail ? (
                                    <img
                                        src={playlist.items[0].media.thumbnail.startsWith('http') ? playlist.items[0].media.thumbnail : `http://localhost:5000${playlist.items[0].media.thumbnail}`}
                                        alt=""
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <ListMusic className="w-16 h-16 text-white/50" />
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                        <Play className="w-6 h-6 text-white fill-current" />
                                    </div>
                                </div>

                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md border border-white/10">
                                    {playlist.items?.length || 0} items
                                </div>
                            </div>

                            <div className="p-5 relative">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-100 truncate text-lg group-hover:text-primary-400 transition-colors">
                                            {playlist.name}
                                        </h3>
                                        {playlist.description && (
                                            <p className="text-sm text-gray-500 truncate mt-1">
                                                {playlist.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3">
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(playlist.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, playlist.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        title="Delete Playlist"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Playlist Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in">
                    <div className="card max-w-md w-full p-8 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-100">New Playlist</h2>
                                <p className="text-sm text-gray-400 mt-1">Give your collection a name and description</p>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Playlist Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input w-full bg-white/5 border-white/10 text-lg py-3 focus:border-primary-500 transition-colors"
                                    placeholder="My awesome collection"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full bg-white/5 border-white/10 h-24 py-3 resize-none focus:border-primary-500 transition-colors"
                                    placeholder="What's this playlist about?"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={handleCreatePlaylist} className="btn btn-primary flex-1 py-4 text-sm font-bold uppercase tracking-widest">Create Playlist</button>
                                <button onClick={closeModal} className="btn btn-secondary flex-1 py-4 text-sm font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border-white/10">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Playlists;
