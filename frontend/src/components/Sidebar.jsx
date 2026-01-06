import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import {
    Home,
    Library,
    ListMusic,
    Download,
    Settings,
    ChevronLeft,
    Music,
    Video
} from 'lucide-react';
import { toggleSidebar } from '../store/slices/themeSlice';

const Sidebar = () => {
    const dispatch = useDispatch();
    const { sidebarCollapsed } = useSelector((state) => state.theme);
    const { playlists } = useSelector((state) => state.playlist);

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/library', icon: Library, label: 'Library' },
        { path: '/playlists', icon: ListMusic, label: 'Playlists' },
        { path: '/downloads', icon: Download, label: 'Downloads' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <aside className={`fixed left-0 top-0 h-screen bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-16' : 'w-64'
            }`}>
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-dark-700">
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                            MediaPlayer
                        </span>
                    </div>
                )}

                <button
                    onClick={() => dispatch(toggleSidebar())}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                >
                    <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''
                        }`} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <span className="font-medium">{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Playlists */}
            {!sidebarCollapsed && playlists.length > 0 && (
                <div className="px-4 mt-6">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Playlists
                    </h3>
                    <div className="space-y-1">
                        {playlists.slice(0, 5).map((playlist) => (
                            <button
                                key={playlist.id}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                            >
                                <ListMusic className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-sm">{playlist.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
