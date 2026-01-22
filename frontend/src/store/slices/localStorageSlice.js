import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    permission: {
        granted: localStorage.getItem('localStoragePermission') === 'true' ? true : false,
        requested: localStorage.getItem('localStorageRequested') === 'true' ? true : false,
    },
    localFiles: [],
    // Folders management
    folders: [], // [{ id, name, count }] - Handles are not serializable, so we manage them in runtime/component state mostly or re-request
    scanning: false,
    scanError: null,
    selectedPaths: JSON.parse(localStorage.getItem('selectedLocalPaths') || '[]'),

    // Search and filtering
    searchQuery: '',
    filterType: 'all', // all, video, audio
    sortBy: 'name', // name, date, size, artist, album
    sortOrder: 'asc', // asc, desc

    // Organization
    groupBy: 'type', // type, artist, album, folder

    // Auto-refresh
    autoRefresh: localStorage.getItem('autoRefresh') === 'true' ? true : false,
    lastRefreshTime: null,
    refreshInterval: 30000, // 30 seconds
};

const localStorageSlice = createSlice({
    name: 'localStorage',
    initialState,
    reducers: {
        setPermissionGranted: (state, action) => {
            state.permission.granted = action.payload;
            state.permission.requested = true;
            localStorage.setItem('localStoragePermission', action.payload);
            localStorage.setItem('localStorageRequested', 'true');
        },
        setLocalFiles: (state, action) => {
            state.localFiles = action.payload;
            state.lastRefreshTime = Date.now();
        },
        setScanningState: (state, action) => {
            state.scanning = action.payload;
        },
        setScanError: (state, action) => {
            state.scanError = action.payload;
        },
        addSelectedPath: (state, action) => {
            if (!state.selectedPaths.includes(action.payload)) {
                state.selectedPaths.push(action.payload);
                localStorage.setItem('selectedLocalPaths', JSON.stringify(state.selectedPaths));
            }
        },
        removeSelectedPath: (state, action) => {
            state.selectedPaths = state.selectedPaths.filter(path => path !== action.payload);
            localStorage.setItem('selectedLocalPaths', JSON.stringify(state.selectedPaths));
        },
        addFolder: (state, action) => {
            const tempFolders = [...state.folders, action.payload];
            // Deduplicate by ID
            state.folders = tempFolders.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        },
        removeFolder: (state, action) => {
            state.folders = state.folders.filter(f => f.id !== action.payload);
            // Also remove files associated with this folder
            state.localFiles = state.localFiles.filter(f => f.folderId !== action.payload);
        },
        setFolders: (state, action) => {
            state.folders = action.payload;
        },
        clearSelectedPaths: (state) => {
            state.selectedPaths = [];
            localStorage.setItem('selectedLocalPaths', JSON.stringify([]));
        },

        // Search and filtering
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFilterType: (state, action) => {
            state.filterType = action.payload;
        },
        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        setSortOrder: (state, action) => {
            state.sortOrder = action.payload;
        },
        toggleSortOrder: (state) => {
            state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
        },

        // Organization
        setGroupBy: (state, action) => {
            state.groupBy = action.payload;
        },

        // Auto-refresh
        setAutoRefresh: (state, action) => {
            state.autoRefresh = action.payload;
            localStorage.setItem('autoRefresh', action.payload);
        },
        setRefreshInterval: (state, action) => {
            state.refreshInterval = action.payload;
        },
    }
});

export const {
    setPermissionGranted,
    setLocalFiles,
    setScanningState,
    setScanError,
    addSelectedPath,
    removeSelectedPath,
    clearSelectedPaths,
    addFolder,
    removeFolder,
    setFolders,
    setSearchQuery,
    setFilterType,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setGroupBy,
    setAutoRefresh,
    setRefreshInterval,
} = localStorageSlice.actions;

export default localStorageSlice.reducer;
