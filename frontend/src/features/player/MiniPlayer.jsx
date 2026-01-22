import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Maximize2,
    X,
} from 'lucide-react';
import {
    togglePlay,
    setVolume,
    toggleMute,
    setCurrentTime,
    setMiniPlayer,
} from '../../store/slices/playerSlice';
import { nextTrack, previousTrack } from '../../store/slices/playlistSlice';
import { formatTime } from '../../utils/helpers';

const MiniPlayer = () => {
    const dispatch = useDispatch();
    const progressRef = useRef(null);
    const volumeRef = useRef(null);

    const { currentMedia, isPlaying, volume, isMuted, currentTime, duration, isMiniPlayer } =
        useSelector((state) => state.player);
    const { queue, currentIndex } = useSelector((state) => state.playlist);

    if (!isMiniPlayer || !currentMedia) return null;

    const currentTrack = queue[currentIndex];

    const handleProgressClick = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        dispatch(setCurrentTime(percent * duration));
    };

    const handleVolumeChange = (e) => {
        const rect = volumeRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        dispatch(setVolume(Math.max(0, Math.min(1, percent))));
    };

    return (
        <div className="mini-player">
            {/* Progress Bar */}
            <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="progress-bar cursor-pointer h-1"
            >
                <div
                    className="progress-fill"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                />
            </div>

            <div className="px-6 py-4 flex items-center gap-6">
                {/* Track Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {currentTrack?.thumbnail && (
                        <img
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            className="w-14 h-14 rounded-lg object-cover"
                        />
                    )}
                    <div className="min-w-0">
                        <h4 className="font-semibold text-gray-100 truncate">
                            {currentTrack?.title || 'Unknown Track'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {currentTrack?.artist || 'Unknown Artist'}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {/* Previous */}
                    <button
                        onClick={() => dispatch(previousTrack())}
                        className="player-control"
                        disabled={currentIndex === 0}
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>

                    {/* Play/Pause */}
                    <button
                        onClick={() => dispatch(togglePlay())}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-all"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6" fill="currentColor" />
                        ) : (
                            <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                        )}
                    </button>

                    {/* Next */}
                    <button
                        onClick={() => dispatch(nextTrack())}
                        className="player-control"
                        disabled={currentIndex === queue.length - 1}
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>

                    {/* Time */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[100px] text-center">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>

                {/* Volume & Actions */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    {/* Volume */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => dispatch(toggleMute())}
                            className="player-control"
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                        <div
                            ref={volumeRef}
                            onClick={handleVolumeChange}
                            className="w-24 h-1 bg-gray-300 dark:bg-dark-700 rounded-full cursor-pointer"
                        >
                            <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Expand */}
                    <button className="player-control">
                        <Maximize2 className="w-5 h-5" />
                    </button>

                    {/* Close */}
                    <button
                        onClick={() => dispatch(setMiniPlayer(false))}
                        className="player-control"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;
