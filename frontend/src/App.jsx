import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import Downloads from './pages/Downloads';
import Settings from './pages/Settings';
import Player from './features/player/Player';
import MiniPlayer from './features/player/MiniPlayer';
import PlayerDemo from './pages/PlayerDemo';
import './styles/index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/player/:id" element={<Player />} />
              <Route path="/demo" element={<PlayerDemo />} />
            </Routes>
          </Layout>
          <MiniPlayer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
