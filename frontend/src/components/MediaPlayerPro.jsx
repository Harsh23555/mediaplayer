import React from 'react';

export default function MediaPlayerPro() {
  return (
    <div className="hero">
      <div className="hero-icon">
        <span>▶</span>
      </div>

      <h1>Your Ultimate Media Player</h1>

      <p>
        Experience smooth playback of all your favorite music and videos with powerful
        features like playlist management, download manager, multi-language support,
        and an Apple-like smooth interface.
      </p>

      <div className="buttons">
        <button className="btn-primary">Start Playing</button>
        <button className="btn-secondary">Download Media</button>
      </div>
    </div>
  );
}
