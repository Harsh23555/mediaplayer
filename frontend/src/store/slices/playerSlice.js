import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentMedia: null,
    isPlaying: false,
    volume: 1,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    isFullscreen: false,
    isMiniPlayer: false,
    currentSubtitle: null,
    currentAudioTrack: 0,
    subtitles: [],
    audioTracks: [],
    quality: 'auto',
    autoPlay: true,
};

const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        toggleAutoPlay: (state) => {
            state.autoPlay = !state.autoPlay;
        },
        setCurrentMedia: (state, action) => {
            state.currentMedia = action.payload;
            state.currentTime = 0;
            state.isPlaying = false;
        },
        togglePlay: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setPlaying: (state, action) => {
            state.isPlaying = action.payload;
        },
        setVolume: (state, action) => {
            state.volume = action.payload;
            state.isMuted = action.payload === 0;
        },
        toggleMute: (state) => {
            state.isMuted = !state.isMuted;
        },
        setCurrentTime: (state, action) => {
            state.currentTime = action.payload;
        },
        setDuration: (state, action) => {
            state.duration = action.payload;
        },
        setPlaybackRate: (state, action) => {
            state.playbackRate = action.payload;
        },
        toggleFullscreen: (state) => {
            state.isFullscreen = !state.isFullscreen;
        },
        setFullscreen: (state, action) => {
            state.isFullscreen = action.payload;
        },
        toggleMiniPlayer: (state) => {
            state.isMiniPlayer = !state.isMiniPlayer;
        },
        setMiniPlayer: (state, action) => {
            state.isMiniPlayer = action.payload;
        },
        setCurrentSubtitle: (state, action) => {
            state.currentSubtitle = action.payload;
        },
        setCurrentAudioTrack: (state, action) => {
            state.currentAudioTrack = action.payload;
        },
        setSubtitles: (state, action) => {
            state.subtitles = action.payload;
        },
        setAudioTracks: (state, action) => {
            state.audioTracks = action.payload;
        },
        setQuality: (state, action) => {
            state.quality = action.payload;
        },
        resetPlayer: (state) => {
            return initialState;
        },
    },
});

export const {
    toggleAutoPlay,
    setCurrentMedia,
    togglePlay,
    setPlaying,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    setPlaybackRate,
    toggleFullscreen,
    setFullscreen,
    toggleMiniPlayer,
    setMiniPlayer,
    setCurrentSubtitle,
    setCurrentAudioTrack,
    setSubtitles,
    setAudioTracks,
    setQuality,
    resetPlayer,
} = playerSlice.actions;

export default playerSlice.reducer;
