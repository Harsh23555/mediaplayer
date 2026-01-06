import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    playlists: [],
    currentPlaylist: null,
    queue: [],
    currentIndex: 0,
    shuffle: false,
    repeat: 'none', // 'none', 'all', 'one'
};

const playlistSlice = createSlice({
    name: 'playlist',
    initialState,
    reducers: {
        setPlaylists: (state, action) => {
            state.playlists = action.payload;
        },
        addPlaylist: (state, action) => {
            state.playlists.push(action.payload);
        },
        updatePlaylist: (state, action) => {
            const index = state.playlists.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.playlists[index] = action.payload;
            }
        },
        deletePlaylist: (state, action) => {
            state.playlists = state.playlists.filter(p => p.id !== action.payload);
        },
        setCurrentPlaylist: (state, action) => {
            state.currentPlaylist = action.payload;
        },
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
});

export const {
    setPlaylists,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    setCurrentPlaylist,
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
