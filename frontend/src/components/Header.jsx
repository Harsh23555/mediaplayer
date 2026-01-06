import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Sun, Moon, Upload } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { toggleTheme } from '../store/slices/themeSlice';

const Header = () => {
    const dispatch = useDispatch();
    const { theme } = useSelector((state) => state.theme);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Implement search functionality
        console.log('Searching for:', searchQuery);
    };

    return (
        <header className="navbar">
            <div className="logo">
                <div className="logo-icon">▶</div>
                <div className="logo-text">Media Player Pro</div>
            </div>

            <nav className="nav-links">
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                    Home
                </NavLink>
                <NavLink to="/player" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Player
                </NavLink>
                <NavLink to="/playlists" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Playlist
                </NavLink>
                <NavLink to="/downloads" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Downloads
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
                    Settings
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
                    About
                </NavLink>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <form onSubmit={handleSearch} className="">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for music, videos..."
                            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            style={{ width: 220 }}
                        />
                    </div>
                </form>

                <button className="btn btn-primary flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                </button>

                <button
                    onClick={() => dispatch(toggleTheme())}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-gray-700" />
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
