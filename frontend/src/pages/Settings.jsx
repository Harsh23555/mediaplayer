import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings as SettingsIcon, Moon, Sun, Volume2, Gauge, FolderOpen, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toggleTheme, setSubtitleSize, setAutoplay } from '../store/slices/themeSlice';
import { setPermissionGranted, setLocalFiles, setScanningState, setScanError, addFolder, removeFolder } from '../store/slices/localStorageSlice';
import { requestLocalStoragePermission, scanDirectory } from '../utils/localStorageUtils';

const Settings = () => {
    const dispatch = useDispatch();
    const { theme, subtitleSize, autoplay } = useSelector((state) => state.theme);
    const { permission, scanning, scanError, localFiles, folders } = useSelector((state) => state.localStorage);
    const [requestError, setRequestError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleRequestPermission = async () => {
        setRequestError(null);
        setSuccessMessage(null);
        dispatch(setScanningState(true));

        try {
            const dirHandle = await requestLocalStoragePermission();
            const folderId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // Scan the directory
            const mediaFiles = await scanDirectory(dirHandle, [], 5, 0, folderId);

            if (mediaFiles.length === 0) {
                setSuccessMessage('No supported media files found in the selected directory.');
            } else {
                setSuccessMessage(`Found ${mediaFiles.length} files in "${dirHandle.name}".`);
            }

            dispatch(setPermissionGranted(true));

            // Add folder
            dispatch(addFolder({
                id: folderId,
                name: dirHandle.name,
                fileCount: mediaFiles.length,
                handle: dirHandle
            }));

            // Append files to existing list
            const newFilesList = [...localFiles, ...mediaFiles];
            dispatch(setLocalFiles(newFilesList));

        } catch (err) {
            const errorMsg = err.message || 'Failed to request permission';
            setRequestError(errorMsg);
            dispatch(setScanError(errorMsg));
        } finally {
            dispatch(setScanningState(false));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-100">
                Settings
            </h1>

            {/* Appearance */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    Appearance
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-100">Theme</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Choose your preferred theme
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                console.log('Settings: toggleTheme clicked, current theme:', theme);
                                dispatch(toggleTheme());
                            }}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            {theme === 'dark' ? (
                                <>
                                    <Sun className="w-4 h-4" />
                                    Light
                                </>
                            ) : (
                                <>
                                    <Moon className="w-4 h-4" />
                                    Dark
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Playback */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Playback
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-100">Autoplay</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Automatically play next track
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoplay}
                                onChange={(e) => dispatch(setAutoplay(e.target.checked))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block font-medium text-gray-100 mb-2">
                            Default Quality
                        </label>
                        <select className="input">
                            <option value="auto">Auto</option>
                            <option value="4k">4K (2160p)</option>
                            <option value="1080p">Full HD (1080p)</option>
                            <option value="720p">HD (720p)</option>
                            <option value="480p">SD (480p)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Subtitles */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">
                    Subtitles
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block font-medium text-gray-100 mb-2">
                            Subtitle Size
                        </label>
                        <select
                            value={subtitleSize}
                            onChange={(e) => dispatch(setSubtitleSize(e.target.value))}
                            className="input"
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="xlarge">Extra Large</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Local Storage Access */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Manage Library Folders
                </h2>
                <div className="space-y-4">
                    <div className="bg-gray-900 dark:bg-dark-700 p-4 rounded-lg border border-gray-800 dark:border-gray-700">
                        {/* Folder List */}
                        {folders && folders.length > 0 ? (
                            <div className="space-y-3 mb-4">
                                {folders.map((folder) => (
                                    <div key={folder.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FolderOpen className="w-5 h-5 text-blue-400" />
                                            <div>
                                                <p className="font-medium text-gray-100">{folder.name}</p>
                                                <p className="text-xs text-gray-400">{folder.fileCount} files scanned</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => dispatch(removeFolder(folder.id))}
                                            className="text-red-400 hover:text-red-300 p-2"
                                            title="Remove folder"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <p>No folders added yet. Add folders to build your library.</p>
                            </div>
                        )}

                        {requestError && (
                            <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg mb-4 text-sm">
                                ⚠️ {requestError}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-900/20 border border-green-800 text-green-300 p-3 rounded-lg mb-4 text-sm">
                                ✓ {successMessage}
                            </div>
                        )}

                        <button
                            onClick={handleRequestPermission}
                            disabled={scanning}
                            className={`btn btn-primary w-full flex items-center justify-center gap-2 ${scanning ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <FolderOpen className="w-4 h-4" />
                            {scanning ? 'Scanning...' : 'Add Folder'}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                        <p>📝 <strong>Supported formats:</strong></p>
                        <p className="ml-4">🎬 Video: mp4, webm, mkv... (Metadata only)</p>
                        <p className="ml-4">🎵 Audio: mp3, wav, flac...</p>
                        <p className="ml-4">🖼️ Image: jpg, png, webp...</p>
                        <p className="ml-4">📄 Document: pdf, txt...</p>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    About
                </h2>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                    <p><strong>Version:</strong> 1.0.0</p>
                    <p><strong>Build:</strong> 2026.01.03</p>
                    <p className="text-sm mt-4">
                        A modern, high-performance media player for web and desktop
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
