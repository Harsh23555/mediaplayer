import React, { useState, useEffect } from 'react';
import { Plus, ListMusic } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { addPlaylist } from '../store/slices/playlistSlice';

const Playlists = () => {
    const { playlists } = useSelector((state) => state.playlist);
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openCreate) {
            setShowModal(true);
            // clear the state so it doesn't reopen on navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const openModal = () => setShowModal(true);
    const closeModal = () => { setShowModal(false); setName(''); };

    const createPlaylist = () => {
        const trimmed = name.trim();
        if (!trimmed) return alert('Please enter a playlist name');
        const newPlaylist = { id: Date.now(), name: trimmed, items: [] };
        dispatch(addPlaylist(newPlaylist));
        closeModal();
        alert('Playlist created');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-100">
                    Playlists
                </h1>
                <button onClick={openModal} className="btn btn-primary flex items-center gap-2">
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
                        <h3 className="text-xl font-semibold text-gray-100 mb-2">
                            No playlists yet
                        </h3>
                        <p className="mb-6">Create your first playlist to organize your media</p>
                        <button onClick={openModal} className="btn btn-primary">
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
                            <h3 className="font-semibold text-gray-100 mb-1">
                                {playlist.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {playlist.items?.length || 0} items
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Playlist Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="card max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-100">Create Playlist</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Playlist name</label>
                                <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="Favorites" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={createPlaylist} className="btn btn-primary flex-1">Create</button>
                                <button onClick={closeModal} className="btn btn-secondary flex-1">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Playlists;
