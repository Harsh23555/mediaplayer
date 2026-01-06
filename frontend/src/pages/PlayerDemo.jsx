import React, { useRef, useState } from "react";
import "../styles/index.css";

function PlayerDemo() {
  const uploadRef = useRef();
  const audioRef = useRef();
  const videoRef = useRef();

  const [mediaList, setMediaList] = useState([]);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState(0);
  const [downloads, setDownloads] = useState(0);
  const [nowPlaying, setNowPlaying] = useState("No media playing");
  const [showVideo, setShowVideo] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    setMediaList((prev) => [...prev, ...files]);
    setTotal((t) => t + files.length);
  };

  const playMedia = (file) => {
    setRecent((r) => r + 1);
    setNowPlaying("Playing: " + file.name);

    const url = URL.createObjectURL(file);

    if (file.type.startsWith("video")) {
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
      }
      if (audioRef.current) audioRef.current.pause();
    } else {
      setShowVideo(false);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      if (videoRef.current) videoRef.current.pause();
    }
  };

  const playPause = () => {
    if (showVideo) {
      if (!videoRef.current) return;
      if (!videoRef.current.paused) videoRef.current.pause();
      else videoRef.current.play();
    } else {
      if (!audioRef.current) return;
      if (!audioRef.current.paused) audioRef.current.pause();
      else audioRef.current.play();
    }
  };

  const startDownload = () => {
    setDownloads((d) => d + 1);
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 200);
  };

  const changeLanguage = (e) => {
    alert(
      "Live language switched to: " +
        e.target.value +
        "\n(Connect translation API here)"
    );
  };

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>MediaPlayer</h2>
        <ul>
          <li>Home</li>
          <li>Library</li>
          <li>Playlists</li>
          <li>Downloads</li>
          <li>Settings</li>
          <li>About</li>
        </ul>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="top">
          <input
            className="search"
            placeholder="Search for music, videos..."
          />
          <button className="upload" onClick={() => uploadRef.current.click()}>
            Upload
          </button>
          <input
            type="file"
            multiple
            hidden
            ref={uploadRef}
            onChange={handleUpload}
          />
        </div>

        <div className="hero">
          <h1>Your Ultimate Media Player</h1>
          <p>
            Smooth music & video playback with subtitles, live language change
            and downloads.
          </p>
          <button>▶ Start Playing</button>
          <button onClick={startDownload}>⬇ Download Media</button>
        </div>

        <div className="stats">
          <div className="stat"><h2>{total}</h2><p>Total Media</p></div>
          <div className="stat"><h2>0</h2><p>Playlists</p></div>
          <div className="stat"><h2>{downloads}</h2><p>Downloads</p></div>
          <div className="stat"><h2>{recent}</h2><p>Recently Played</p></div>
        </div>

        <h3>Recently Played</h3>
        {mediaList.map((file, i) => (
          <div
            key={i}
            className="media-item"
            onClick={() => playMedia(file)}
          >
            {file.name}
          </div>
        ))}

        {showVideo && (
          <div className="video-container">
            <video ref={videoRef} controls />
            <div className="controls">
              <select onChange={changeLanguage}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
              <button onClick={startDownload}>Download</button>
            </div>

            <div className="progress">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* PLAYER BAR */}
      <div className="player-bar">
        <button onClick={playPause}>▶</button>
        <span>{nowPlaying}</span>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}

export default PlayerDemo;
