import { configureStore } from '@reduxjs/toolkit';
import playerReducer from './slices/playerSlice';
import playlistReducer from './slices/playlistSlice';
import downloadReducer from './slices/downloadSlice';
import themeReducer from './slices/themeSlice';
import localStorageReducer from './slices/localStorageSlice';

export const store = configureStore({
    reducer: {
        player: playerReducer,
        playlist: playlistReducer,
        downloads: downloadReducer,
        theme: themeReducer,
        localStorage: localStorageReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: [
                    'player/setCurrentMedia',
                    'localStorage/addFolder',
                    'localStorage/setLocalFiles',
                    'localStorage/setScanningState',
                    'playlist/setQueue',
                    'playlist/setCurrentIndex',
                    'player/setPlaying'
                ],
                // Ignore these field paths in all actions
                ignoredActionPaths: [
                    'payload.videoElement',
                    'payload.handle',
                    'payload.dirHandle',
                    'payload.0.handle',
                    'meta.arg.handle'
                ],
                // Ignore these paths in the state
                ignoredPaths: [
                    'player.currentMedia',
                    'localStorage.folders',
                    'localStorage.localFiles',
                    'playlist.queue'
                ],
            },
        }),
});

export default store;
