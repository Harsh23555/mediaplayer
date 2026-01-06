import React from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    const { sidebarCollapsed } = useSelector((state) => state.theme);
    const { isMiniPlayer } = useSelector((state) => state.player);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'
                }`}>
                <Header />

                <main className={`flex-1 overflow-y-auto ${isMiniPlayer ? 'mb-24' : 'mb-0'
                    } transition-all duration-300`}>
                    <div className="container mx-auto px-4 py-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
