import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Settings as SettingsIcon, Moon, Sun, Volume2, Gauge } from 'lucide-react';
import { toggleTheme, setSubtitleSize, setAutoplay } from '../store/slices/themeSlice';

const Settings = () => {
    const dispatch = useDispatch();
    const { theme, subtitleSize, autoplay, quality } = useSelector((state) => state.theme);

    return (
        <div className="space-y-6">
            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
            </h1>

            {/* Appearance */}
            <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Moon className="w-5 h-5" />
                    Appearance
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Choose your preferred theme
                            </p>
                        </div>
                        <button
                            onClick={() => dispatch(toggleTheme())}
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Volume2 className="w-5 h-5" />
                    Playback
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Autoplay</p>
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
                        <label className="block font-medium text-gray-900 dark:text-white mb-2">
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Subtitles
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block font-medium text-gray-900 dark:text-white mb-2">
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
