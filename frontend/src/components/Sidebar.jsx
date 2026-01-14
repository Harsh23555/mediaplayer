import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    // Keeping hooks for future logic if needed
    // const dispatch = useDispatch();
    // const { sidebarCollapsed } = useSelector((state) => state.theme);

    const navItems = [
        { path: '/', icon: '🏠', label: 'Home' },
        { path: '/library', icon: '📚', label: 'Library' },
        { path: '/playlists', icon: '🎧', label: 'Playlists' },
        { path: '/downloads', icon: '⬇', label: 'Downloads' },
        { path: '/settings', icon: '⚙', label: 'Settings' },
    ];

    return (
        <aside className="w-64 bg-panel p-6 hidden md:block fixed left-0 top-0 h-screen overflow-y-auto">
            <h1 className="text-2xl font-bold mb-8 text-white">🎵 MediaPlayer</h1>

            <nav className="space-y-4 text-gray-300">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 hover:text-white ${isActive
                                ? 'text-accent-500 font-semibold'
                                : ''
                            }`
                        }
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
