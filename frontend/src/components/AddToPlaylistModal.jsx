import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Plus, ListMusic, CheckCircle2, Loader2, Music, Video } from 'lucide-react';
import { fetchPlaylists, addMediaToPlaylist } from '../store/slices/playlistSlice';

const AddToPlaylistModal = ({ isOpen, onClose, mediaId, mediaTitle, mediaType }) => {
    const dispatch = useDispatch();
    const { playlists, loading } = useSelector((state) => state.playlist);
    const [addingTo, setAddingTo] = React.useState(null);

    useEffect(() => {
        if (isOpen) {
            dispatch(fetchPlaylists());
        }
    }, [isOpen, dispatch]);

    const handleAddToPlaylist = async (playlistId) => {
        setAddingTo(playlistId);
        try {
            await dispatch(addMediaToPlaylist({ playlistId, mediaId })).unwrap();
            // Show success briefly then close
            setTimeout(() => {
                setAddingTo(null);
                onClose();
            }, 800);
        } catch (err) {
            alert('Failed to add to playlist: ' + err);
            setAddingTo(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all overflow-hidden border-none outline-none">
            <div className="card max-w-md w-full p-0 overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-primary-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">Add to Playlist</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Media Highlight */}
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                            {mediaType === 'video' ? <Video className="w-4 h-4 text-gray-400" /> : <Music className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Adding Item</p>
                            <p className="text-sm font-bold text-gray-100 truncate">{mediaId.startsWith('local_') ? 'Local File' : (mediaTitle || 'Selected Media')}</p>
                        </div>
                    </div>
                </div>

                {/* Playlist List */}
                <div className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                            <p className="text-sm text-gray-500">Loading your playlists...</p>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="py-12 px-6 text-center">
                            <ListMusic className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-400 text-sm mb-4">You haven't created any playlists yet.</p>
                            <button
                                onClick={() => { onClose(); /* Navigate to playlists? */ }}
                                className="text-sm text-primary-400 font-bold uppercase tracking-widest hover:text-primary-300"
                            >
                                Go to Playlists
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {playlists.map((playlist) => {
                                const isAdded = playlist.items?.some(item => item.mediaId === mediaId);
                                const isProcessing = addingTo === playlist.id;

                                return (
                                    <button
                                        key={playlist.id}
                                        disabled={isAdded || isProcessing}
                                        onClick={() => handleAddToPlaylist(playlist.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${isAdded
                                                ? 'bg-primary-500/5 cursor-default'
                                                : 'hover:bg-white/5 bg-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0">
                                                <ListMusic className={`w-5 h-5 ${isAdded ? 'text-primary-500/50' : 'text-gray-400 group-hover:text-primary-400'}`} />
                                            </div>
                                            <div className="text-left min-w-0">
                                                <p className={`font-bold text-sm truncate ${isAdded ? 'text-gray-500' : 'text-gray-200 group-hover:text-white'}`}>
                                                    {playlist.name}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">
                                                    {playlist.items?.length || 0} items
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {isProcessing ? (
                                                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                                            ) : isAdded ? (
                                                <CheckCircle2 className="w-5 h-5 text-primary-500/50" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-primary-500 flex items-center justify-center transition-colors">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
