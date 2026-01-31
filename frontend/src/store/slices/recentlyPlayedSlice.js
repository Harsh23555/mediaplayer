import { createSlice } from '@reduxjs/toolkit';

const RECENTLY_PLAYED_KEY = 'media_player_recently_played';

const loadFromStorage = () => {
    try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (err) {
        console.error('Failed to load recently played from storage:', err);
        return [];
    }
};

const saveToStorage = (state) => {
    try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(state.items));
    } catch (err) {
        console.error('Failed to save recently played to storage:', err);
    }
};

const initialState = {
    items: loadFromStorage(),
};

const recentlyPlayedSlice = createSlice({
    name: 'recentlyPlayed',
    initialState,
    reducers: {
        addToRecentlyPlayed: (state, action) => {
            const media = action.payload;
            if (!media || !media.id) return;

            // Remove existing entry to avoid duplicates and move to top
            state.items = state.items.filter(item => item.id !== media.id);

            // Add to the beginning of the list
            state.items.unshift({
                ...media,
                playedAt: new Date().toISOString()
            });

            // Limit to 50 items
            if (state.items.length > 50) {
                state.items = state.items.slice(0, 50);
            }

            saveToStorage(state);
        },
        removeFromRecentlyPlayed: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload);
            saveToStorage(state);
        },
        clearRecentlyPlayed: (state) => {
            state.items = [];
            localStorage.removeItem(RECENTLY_PLAYED_KEY);
        }
    }
});

export const {
    addToRecentlyPlayed,
    removeFromRecentlyPlayed,
    clearRecentlyPlayed
} = recentlyPlayedSlice.actions;

export default recentlyPlayedSlice.reducer;
