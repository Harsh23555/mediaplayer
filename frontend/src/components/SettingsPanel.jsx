import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Settings,
    Moon,
    Sun,
    HelpCircle,
    X,
    Monitor,
} from 'lucide-react';
import { toggleTheme } from '../store/slices/themeSlice';

const SettingsPanel = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('display');
    const { isDark } = useSelector((state) => state.theme);

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    return (
        <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
            {/* Overlay */}
            <div className="settings-overlay" onClick={onClose} />

            {/* Modal */}
            <div className="settings-modal">
                {/* Header */}
                <div className="settings-header">
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="settings-tabs">
                    <button
                        className={`tab-button ${activeTab === 'display' ? 'active' : ''}`}
                        onClick={() => setActiveTab('display')}
                    >
                        <Monitor className="w-5 h-5" />
                        Display
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'playback' ? 'active' : ''}`}
                        onClick={() => setActiveTab('playback')}
                    >
                        <Settings className="w-5 h-5" />
                        Playback
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'shortcuts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shortcuts')}
                    >
                        <HelpCircle className="w-5 h-5" />
                        Shortcuts
                    </button>
                </div>

                {/* Content */}
                <div className="settings-content">
                    {/* Display Settings */}
                    {activeTab === 'display' && (
                        <div className="settings-section">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Display Settings
                            </h3>

                            {/* Dark/Light Mode */}
                            <div className="setting-item">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isDark ? (
                                            <Moon className="w-5 h-5 text-indigo-400" />
                                        ) : (
                                            <Sun className="w-5 h-5 text-yellow-400" />
                                        )}
                                        <span className="text-white font-medium">
                                            Dark Mode
                                        </span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={isDark}
                                            onChange={handleThemeToggle}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            {/* UI Scale */}
                            <div className="setting-item mt-4">
                                <label className="text-white font-medium mb-2 block">
                                    UI Scale
                                </label>
                                <input
                                    type="range"
                                    min="80"
                                    max="120"
                                    defaultValue="100"
                                    step="10"
                                    className="w-full"
                                />
                                <div className="text-sm text-gray-400 mt-1">
                                    100%
                                </div>
                            </div>

                            {/* Compact Mode */}
                            <div className="setting-item mt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-medium">
                                        Compact Controls
                                    </span>
                                    <label className="toggle-switch">
                                        <input type="checkbox" />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Playback Settings */}
                    {activeTab === 'playback' && (
                        <div className="settings-section">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Playback Settings
                            </h3>

                            {/* Remember Position */}
                            <div className="setting-item">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-white font-medium">
                                            Remember Position
                                        </span>
                                        <p className="text-sm text-gray-400">
                                            Resume from where you left off
                                        </p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            {/* Auto-play Next */}
                            <div className="setting-item mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-white font-medium">
                                            Auto-play Next
                                        </span>
                                        <p className="text-sm text-gray-400">
                                            Automatically play next item in queue
                                        </p>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" defaultChecked />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            {/* Default Quality */}
                            <div className="setting-item mt-4">
                                <label className="text-white font-medium mb-2 block">
                                    Default Quality
                                </label>
                                <select className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-indigo-500 outline-none">
                                    <option>Auto</option>
                                    <option>1080p</option>
                                    <option>720p</option>
                                    <option>480p</option>
                                    <option>360p</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Keyboard Shortcuts */}
                    {activeTab === 'shortcuts' && (
                        <div className="settings-section max-h-96 overflow-y-auto">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Keyboard Shortcuts
                            </h3>

                            <div className="space-y-3">
                                <ShortcutItem keys="Spacebar" action="Play / Pause" />
                                <ShortcutItem keys="← / →" action="Seek ±5 seconds" />
                                <ShortcutItem keys="↑ / ↓" action="Volume ±10%" />
                                <ShortcutItem keys="M" action="Mute / Unmute" />
                                <ShortcutItem keys="F" action="Fullscreen" />
                                <ShortcutItem keys="< / >" action="Speed ±0.25x" />
                                <ShortcutItem keys="0-9" action="Jump to 0-90%" />
                                <ShortcutItem keys="ESC" action="Exit Fullscreen" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="settings-footer border-t border-slate-600 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShortcutItem = ({ keys, action }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-gray-300">{action}</span>
        <span className="flex gap-1">
            {keys.split(' / ').map((key, idx) => (
                <kbd
                    key={idx}
                    className="px-2 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600 font-mono"
                >
                    {key}
                </kbd>
            ))}
        </span>
    </div>
);

export default SettingsPanel;
