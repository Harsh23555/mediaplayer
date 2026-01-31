import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { playlistAPI } from '../../utils/api';

export const fetchPlaylists = createAsyncThunk(
    'playlist/fetchPlaylists',
    async (_, { rejectWithValue }) => {
        try {
            const response = await playlistAPI.getAll();
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to fetch playlists');
        }
    }
);

export const createPlaylist = createAsyncThunk(
    'playlist/createPlaylist',
    async (playlistData, { rejectWithValue }) => {
        try {
            const response = await playlistAPI.create(playlistData);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to create playlist');
        }
    }
);

export const deletePlaylist = createAsyncThunk(
    'playlist/deletePlaylist',
    async (id, { rejectWithValue }) => {
        try {
            await playlistAPI.delete(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to delete playlist');
        }
    }
);

export const addMediaToPlaylist = createAsyncThunk(
    'playlist/addMediaToPlaylist',
    async ({ playlistId, mediaId }, { rejectWithValue }) => {
        try {
            const response = await playlistAPI.addItem(playlistId, mediaId);
            return response.data; // Returns updated playlist
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to add item to playlist');
        }
    }
);

export const removeMediaFromPlaylist = createAsyncThunk(
    'playlist/removeMediaFromPlaylist',
    async ({ playlistId, itemId }, { rejectWithValue }) => {
        try {
            const response = await playlistAPI.removeItem(playlistId, itemId);
            return response.data; // Returns updated playlist
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || 'Failed to remove item from playlist');
        }
    }
);

const initialState = {
    playlists: [],
    currentPlaylist: null,
    queue: [],
    currentIndex: 0,
    shuffle: false,
    repeat: 'none', // 'none', 'all', 'one'
    loading: false,
    error: null
};

const playlistSlice = createSlice({
    name: 'playlist',
    initialState,
    reducers: {
        setQueue: (state, action) => {
            state.queue = action.payload;
        },
        addToQueue: (state, action) => {
            state.queue.push(action.payload);
        },
        removeFromQueue: (state, action) => {
            state.queue = state.queue.filter((_, index) => index !== action.payload);
        },
        reorderQueue: (state, action) => {
            const { fromIndex, toIndex } = action.payload;
            const item = state.queue[fromIndex];
            state.queue.splice(fromIndex, 1);
            state.queue.splice(toIndex, 0, item);
        },
        setCurrentIndex: (state, action) => {
            state.currentIndex = action.payload;
        },
        nextTrack: (state) => {
            if (state.currentIndex < state.queue.length - 1) {
                state.currentIndex += 1;
            } else if (state.repeat === 'all') {
                state.currentIndex = 0;
            }
        },
        previousTrack: (state) => {
            if (state.currentIndex > 0) {
                state.currentIndex -= 1;
            } else if (state.repeat === 'all') {
                state.currentIndex = state.queue.length - 1;
            }
        },
        toggleShuffle: (state) => {
            state.shuffle = !state.shuffle;
        },
        setRepeat: (state, action) => {
            state.repeat = action.payload;
        },
        clearQueue: (state) => {
            state.queue = [];
            state.currentIndex = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Playlists
            .addCase(fetchPlaylists.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPlaylists.fulfilled, (state, action) => {
                state.loading = false;
                state.playlists = action.payload;
            })
            .addCase(fetchPlaylists.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create Playlist
            .addCase(createPlaylist.fulfilled, (state, action) => {
                state.playlists.unshift(action.payload);
            })
            // Delete Playlist
            .addCase(deletePlaylist.fulfilled, (state, action) => {
                state.playlists = state.playlists.filter(p => p.id !== action.payload);
            })
            // Add/Remove Items (Updates the playlist in the list)
            .addMatcher(
                (action) => [addMediaToPlaylist.fulfilled.type, removeMediaFromPlaylist.fulfilled.type].includes(action.type),
                (state, action) => {
                    const index = state.playlists.findIndex(p => p.id === action.payload.id);
                    if (index !== -1) {
                        state.playlists[index] = action.payload;
                    }
                    if (state.currentPlaylist?.id === action.payload.id) {
                        state.currentPlaylist = action.payload;
                    }
                }
            );
    }
});

export const {
    setQueue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    setCurrentIndex,
    nextTrack,
    previousTrack,
    toggleShuffle,
    setRepeat,
    clearQueue,
} = playlistSlice.actions;

export default playlistSlice.reducer;
