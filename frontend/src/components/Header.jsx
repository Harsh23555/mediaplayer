import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Moon, Upload, Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toggleTheme } from '../store/slices/themeSlice';

const Header = () => {
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
    };

    const navItems = [
        { path: '/', label: 'Home' },
        { path: '/library', label: 'Library' },
        { path: '/playlists', label: 'Playlists' },
        { path: '/downloads', label: 'Downloads' },
        { path: '/settings', label: 'Settings' },
    ];

    return (
        <header className="flex items-center justify-between mb-6">
            {/* Left: logo + mobile hamburger */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation"
                >
                    <Menu className="w-6 h-6 text-gray-200" />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-accent-600 flex items-center justify-center text-white font-bold">▶</div>
                    <div className="text-lg font-semibold text-white">Media Player Pro</div>
                </div>
            </div>

            {/* Center: search (hidden on very small screens) */}
            <form onSubmit={handleSearch} className="hidden sm:block flex-1 mx-6">
                <div className="relative max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for music, videos..."
                        className="pl-10 pr-4 py-2 bg-panel border-0 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 w-full"
                        aria-label="Search"
                    />
                </div>
            </form>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
                {/* Upload button removed */}

                <button
                    onClick={() => {
                        console.log('Header: toggleTheme clicked, current theme:', theme);
                        dispatch(toggleTheme());
                    }}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                        <Moon className="w-5 h-5 text-gray-700" />
                    )}
                </button>
            </div>

            {/* Mobile nav overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="w-64 p-6 mobile-nav-backdrop card">
                        <div className="flex items-center justify-between mb-6">
                            <div className="text-lg font-semibold">Menu</div>
                            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-2 rounded-md hover:bg-white/5">
                                <X className="w-5 h-5 text-gray-100" />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-4 text-gray-200">
                            {navItems.map((item) => (
                                <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={({ isActive }) => `py-2 rounded-md ${isActive ? 'text-accent-400 font-semibold' : 'text-gray-200 hover:text-white'}`}>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                    <div className="flex-1" onClick={() => setMobileOpen(false)} />
                </div>
            )}
        </header>
    );
};

export default Header; 
