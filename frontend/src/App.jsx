import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Layout from './components/Layout';
import Home from './pages/Home';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Downloads from './pages/Downloads';
import Settings from './pages/Settings';
import Player from './features/player/Player';
import MiniPlayer from './features/player/MiniPlayer';
import PlayerDemo from './pages/PlayerDemo';
import Login from './pages/Login';
import Register from './pages/Register';
import './styles/index.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App min-h-screen bg-bg text-gray-100 transition-colors duration-300">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/player/:id" element={<Player />} />
              <Route path="/demo" element={<PlayerDemo />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Layout>
          <MiniPlayer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
