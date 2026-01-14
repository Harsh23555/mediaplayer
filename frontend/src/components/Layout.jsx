import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
    return (
        <div className="flex h-screen bg-bg text-white font-sans overflow-hidden">
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300 h-full">
                <main className="flex-1 overflow-y-auto p-8">
                    <Header />
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
