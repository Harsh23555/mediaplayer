import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    Subtitles,
    Languages,
    ArrowLeft,
} from 'lucide-react';
import {
    togglePlay,
    setPlaying,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    toggleFullscreen,
    setPlaybackRate,
    setCurrentSubtitle,
    setCurrentAudioTrack,
} from '../../store/slices/playerSlice';
import { formatTime } from '../../utils/helpers';

const Player = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const progressRef = useRef(null);

    const [showSettings, setShowSettings] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(false);
    const [showAudioTracks, setShowAudioTracks] = useState(false);

    const {
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        playbackRate,
        isFullscreen,
        currentSubtitle,
        currentAudioTrack,
        subtitles,
        audioTracks,
    } = useSelector((state) => state.player);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            dispatch(setCurrentTime(video.currentTime));
        };

        const handleLoadedMetadata = () => {
            dispatch(setDuration(video.duration));
        };

        const handleEnded = () => {
            dispatch(setPlaying(false));
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [dispatch]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.play();
        } else {
            video.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = playbackRate;
    }, [playbackRate]);

    const handleProgressClick = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        dispatch(setCurrentTime(newTime));
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
    };

    const handleFullscreen = () => {
        const video = videoRef.current;
        if (!document.fullscreenElement) {
            video.requestFullscreen();
            dispatch(toggleFullscreen());
        } else {
            document.exitFullscreen();
            dispatch(toggleFullscreen());
        }
    };

    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    return (
        <div className={`${isFullscreen ? 'fullscreen-overlay' : 'relative'}`}>
            {/* Back Button (non-fullscreen) */}
            {!isFullscreen && (
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-10 btn btn-secondary flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            {/* Video Container */}
            <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                <video
                    ref={videoRef}
                    className="w-full h-full"
                    src={`http://localhost:5000/api/media/${id}/stream`}
                    onClick={() => dispatch(togglePlay())}
                />

                {/* Subtitle Overlay */}
                {currentSubtitle && (
                    <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4">
                        <div className="subtitle-text">
                            Current subtitle text will appear here
                        </div>
                    </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    {/* Progress Bar */}
                    <div
                        ref={progressRef}
                        onClick={handleProgressClick}
                        className="progress-bar mb-4 h-1.5 cursor-pointer"
                    >
                        <div
                            className="progress-fill"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Left Controls */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => dispatch(togglePlay())}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6" fill="currentColor" />
                                ) : (
                                    <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                                )}
                            </button>

                            <button className="player-control text-white">
                                <SkipBack className="w-5 h-5" />
                            </button>

                            <button className="player-control text-white">
                                <SkipForward className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-2 ml-2">
                                <button
                                    onClick={() => dispatch(toggleMute())}
                                    className="player-control text-white"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                                    className="volume-slider w-24"
                                />
                            </div>

                            <div className="text-sm text-white font-medium">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                            {/* Subtitles */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSubtitles(!showSubtitles)}
                                    className="player-control text-white"
                                >
                                    <Subtitles className="w-5 h-5" />
                                </button>
                                {showSubtitles && (
                                    <div className="context-menu bottom-12 right-0">
                                        <div className="context-menu-item">
                                            <input type="checkbox" className="mr-2" />
                                            English
                                        </div>
                                        <div className="context-menu-item">
                                            <input type="checkbox" className="mr-2" />
                                            Spanish
                                        </div>
                                        <div className="context-menu-item">
                                            <input type="checkbox" className="mr-2" />
                                            French
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Audio Tracks */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAudioTracks(!showAudioTracks)}
                                    className="player-control text-white"
                                >
                                    <Languages className="w-5 h-5" />
                                </button>
                                {showAudioTracks && (
                                    <div className="context-menu bottom-12 right-0">
                                        <div className="context-menu-item">
                                            <input type="radio" name="audio" className="mr-2" defaultChecked />
                                            English
                                        </div>
                                        <div className="context-menu-item">
                                            <input type="radio" name="audio" className="mr-2" />
                                            Spanish
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="player-control text-white"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                {showSettings && (
                                    <div className="context-menu bottom-12 right-0">
                                        <div className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Playback Speed
                                        </div>
                                        {playbackRates.map((rate) => (
                                            <div
                                                key={rate}
                                                onClick={() => {
                                                    dispatch(setPlaybackRate(rate));
                                                    setShowSettings(false);
                                                }}
                                                className={`context-menu-item ${playbackRate === rate ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                                                    }`}
                                            >
                                                {rate}x {rate === 1 && '(Normal)'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={handleFullscreen}
                                className="player-control text-white"
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-5 h-5" />
                                ) : (
                                    <Maximize className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Info (non-fullscreen) */}
            {!isFullscreen && (
                <div className="mt-6 px-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Video Title
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Video description will appear here
                    </p>
                </div>
            )}
        </div>
    );
};

export default Player;
