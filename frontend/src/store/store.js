import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import playlistReducer from './slices/playlistSlice';
import downloadReducer from './slices/downloadSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
    reducer: {
        player: playerReducer,
        playlist: playlistReducer,
        downloads: downloadReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['player/setCurrentMedia'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.videoElement'],
                // Ignore these paths in the state
                ignoredPaths: ['player.currentMedia'],
            },
        }),
});

export default store;
