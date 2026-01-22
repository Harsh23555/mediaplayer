import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    downloads: [],
    activeDownloads: 0,
};

const downloadSlice = createSlice({
    name: 'downloads',
    initialState,
    reducers: {
        setDownloads: (state, action) => {
            state.downloads = action.payload;
            state.activeDownloads = action.payload.filter(d => d.status === 'downloading').length;
        },
        addDownload: (state, action) => {
            state.downloads.push({
                ...action.payload,
                status: 'pending',
                progress: 0,
                createdAt: new Date().toISOString(),
            });
            state.activeDownloads += 1;
        },
        updateDownload: (state, action) => {
            const { id, updates } = action.payload;
            const download = state.downloads.find(d => d.id === id);
            if (download) {
                Object.assign(download, updates);
            }
        },
        setDownloadProgress: (state, action) => {
            const { id, progress } = action.payload;
            const download = state.downloads.find(d => d.id === id);
            if (download) {
                download.progress = progress;
            }
        },
        setDownloadStatus: (state, action) => {
            const { id, status } = action.payload;
            const download = state.downloads.find(d => d.id === id);
            if (download) {
                const wasActive = download.status === 'downloading';
                download.status = status;

                if (wasActive && (status === 'completed' || status === 'failed' || status === 'cancelled')) {
                    state.activeDownloads = Math.max(0, state.activeDownloads - 1);
                } else if (!wasActive && status === 'downloading') {
                    state.activeDownloads += 1;
                }
            }
        },
        pauseDownload: (state, action) => {
            const download = state.downloads.find(d => d.id === action.payload);
            if (download && download.status === 'downloading') {
                download.status = 'paused';
                state.activeDownloads = Math.max(0, state.activeDownloads - 1);
            }
        },
        resumeDownload: (state, action) => {
            const download = state.downloads.find(d => d.id === action.payload);
            if (download && download.status === 'paused') {
                download.status = 'downloading';
                state.activeDownloads += 1;
            }
        },
        cancelDownload: (state, action) => {
            const download = state.downloads.find(d => d.id === action.payload);
            if (download) {
                if (download.status === 'downloading') {
                    state.activeDownloads = Math.max(0, state.activeDownloads - 1);
                }
                download.status = 'cancelled';
            }
        },
        removeDownload: (state, action) => {
            const download = state.downloads.find(d => d.id === action.payload);
            if (download && download.status === 'downloading') {
                state.activeDownloads = Math.max(0, state.activeDownloads - 1);
            }
            state.downloads = state.downloads.filter(d => d.id !== action.payload);
        },
        clearCompleted: (state) => {
            state.downloads = state.downloads.filter(d => d.status !== 'completed');
        },
    },
});

export const {
    setDownloads,
    addDownload,
    updateDownload,
    setDownloadProgress,
    setDownloadStatus,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    clearCompleted,
} = downloadSlice.actions;

export default downloadSlice.reducer;
