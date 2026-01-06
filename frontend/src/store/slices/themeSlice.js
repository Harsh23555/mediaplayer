import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState = {
    theme: getInitialTheme(),
    sidebarCollapsed: false,
    volume: parseFloat(localStorage.getItem('volume')) || 1,
    playbackRate: parseFloat(localStorage.getItem('playbackRate')) || 1,
    subtitleSize: localStorage.getItem('subtitleSize') || 'medium',
    subtitleLanguage: localStorage.getItem('subtitleLanguage') || 'en',
    audioLanguage: localStorage.getItem('audioLanguage') || 'en',
    autoplay: localStorage.getItem('autoplay') === 'true',
    quality: localStorage.getItem('quality') || 'auto',
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', state.theme);
            document.documentElement.classList.toggle('dark', state.theme === 'dark');
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
            localStorage.setItem('theme', state.theme);
            document.documentElement.classList.toggle('dark', state.theme === 'dark');
        },
        toggleSidebar: (state) => {
            state.sidebarCollapsed = !state.sidebarCollapsed;
        },
        setSidebarCollapsed: (state, action) => {
            state.sidebarCollapsed = action.payload;
        },
        setVolumePreference: (state, action) => {
            state.volume = action.payload;
            localStorage.setItem('volume', action.payload);
        },
        setPlaybackRatePreference: (state, action) => {
            state.playbackRate = action.payload;
            localStorage.setItem('playbackRate', action.payload);
        },
        setSubtitleSize: (state, action) => {
            state.subtitleSize = action.payload;
            localStorage.setItem('subtitleSize', action.payload);
        },
        setSubtitleLanguage: (state, action) => {
            state.subtitleLanguage = action.payload;
            localStorage.setItem('subtitleLanguage', action.payload);
        },
        setAudioLanguage: (state, action) => {
            state.audioLanguage = action.payload;
            localStorage.setItem('audioLanguage', action.payload);
        },
        setAutoplay: (state, action) => {
            state.autoplay = action.payload;
            localStorage.setItem('autoplay', action.payload);
        },
        setQualityPreference: (state, action) => {
            state.quality = action.payload;
            localStorage.setItem('quality', action.payload);
        },
    },
});

export const {
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarCollapsed,
    setVolumePreference,
    setPlaybackRatePreference,
    setSubtitleSize,
    setSubtitleLanguage,
    setAudioLanguage,
    setAutoplay,
    setQualityPreference,
} = themeSlice.actions;

export default themeSlice.reducer;
