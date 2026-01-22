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
    Music,
    Repeat,
    Repeat1,
    PictureInPicture,
    Menu,
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
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import SettingsPanel from '../../components/SettingsPanel';
import PlaylistManager from '../../components/PlaylistManager';
import { formatTime, canPictureInPicture } from '../../utils/helpers';

const Player = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    // Enable keyboard shortcuts
    useKeyboardShortcuts();

    // State Management
    const [showSettings, setShowSettings] = useState(false);
    const [showSubtitles, setShowSubtitles] = useState(false);
    const [showAudioTracks, setShowAudioTracks] = useState(false);
    const [mediaType, setMediaType] = useState('video'); // 'video' or 'audio'
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'all', 'one'
    const [isPictureInPicture, setIsPictureInPicture] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

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

    const { isDark } = useSelector((state) => state.theme);

    // Video event listeners
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
            // Handle repeat modes
            if (repeatMode === 'one') {
                video.currentTime = 0;
                video.play();
            } else if (repeatMode === 'all') {
                // Trigger next track logic
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, [dispatch, repeatMode]);

    // Audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            dispatch(setCurrentTime(audio.currentTime));
        };

        const handleLoadedMetadata = () => {
            dispatch(setDuration(audio.duration));
        };

        const handleEnded = () => {
            dispatch(setPlaying(false));
            if (repeatMode === 'one') {
                audio.currentTime = 0;
                audio.play();
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [dispatch, repeatMode]);

    // Play/pause for video
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.play().catch((err) => console.error('Play error:', err));
        } else {
            video.pause();
        }
    }, [isPlaying]);

    // Play/pause for audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch((err) => console.error('Play error:', err));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // Volume for video and audio
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;

        if (video) {
            video.volume = isMuted ? 0 : volume;
        }
        if (audio) {
            audio.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Playback rate for video and audio
    useEffect(() => {
        const video = videoRef.current;
        const audio = audioRef.current;

        if (video) {
            video.playbackRate = playbackRate;
        }
        if (audio) {
            audio.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    // Auto-hide controls on mouse move (video fullscreen)
    useEffect(() => {
        if (!isFullscreen) return;

        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(controlsTimeoutRef.current);

            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(controlsTimeoutRef.current);
        };
    }, [isFullscreen]);

    // Media Session API for background play
    useEffect(() => {
        if ('mediaSession' in navigator && mediaType === 'audio') {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Now Playing',
                artist: 'Artist Name',
                artwork: [
                    {
                        src: 'https://via.placeholder.com/96x96?text=Music',
                        sizes: '96x96',
                        type: 'image/png',
                    },
                ],
            });

            navigator.mediaSession.setActionHandler('play', () => {
                dispatch(togglePlay());
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                dispatch(togglePlay());
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                // Handle next track
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                // Handle previous track
            });
        }
    }, [dispatch, mediaType]);

    const handleProgressClick = (e) => {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        dispatch(setCurrentTime(newTime));
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const handleFullscreen = () => {
        const video = videoRef.current;
        if (!document.fullscreenElement) {
            video.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            dispatch(toggleFullscreen());
        } else {
            document.exitFullscreen();
            dispatch(toggleFullscreen());
        }
    };

    const handlePictureInPicture = async () => {
        if (!canPictureInPicture()) {
            alert('Picture-in-Picture is not supported on your browser');
            return;
        }

        try {
            const video = videoRef.current;
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPictureInPicture(false);
            } else {
                await video.requestPictureInPicture();
                setIsPictureInPicture(true);
            }
        } catch (error) {
            console.error(`Error with Picture-in-Picture: ${error}`);
        }
    };

    const cycleRepeatMode = () => {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(repeatMode);
        setRepeatMode(modes[(currentIndex + 1) % modes.length]);
    };

    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    return (
        <div className={`${isFullscreen ? 'fullscreen-overlay' : 'relative'} ${isDark ? 'dark' : 'light'}`}>
            {/* Back Button */}
            {!isFullscreen && (
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-20 btn btn-secondary flex items-center gap-2 hover:scale-105 transition-transform"
                    title="Go back"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            {/* VIDEO PLAYBACK FRAME */}
            {mediaType === 'video' && (
                <div
                    className="relative bg-black"
                    style={{ aspectRatio: '16/9' }}
                    onMouseMove={() => isFullscreen && setShowControls(true)}
                    onMouseLeave={() => isFullscreen && setShowControls(false)}
                >
                    <video
                        ref={videoRef}
                        className="w-full h-full"
                        src={`http://localhost:5000/api/media/${id}/stream`}
                        onClick={() => dispatch(togglePlay())}
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    {/* Subtitle Overlay */}
                    {currentSubtitle && (
                        <div className="absolute bottom-24 left-0 right-0 flex justify-center px-4 pointer-events-none">
                            <div className="subtitle-text bg-black/70 px-3 py-2 rounded text-white text-center max-w-2xl">
                                Current subtitle text will appear here
                            </div>
                        </div>
                    )}

                    {/* Loading Spinner */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center ${
                            isPlaying && !videoRef.current?.readyState ? 'visible' : 'hidden'
                        }`}
                    >
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
                    </div>

                    {/* Controls Overlay */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 transition-opacity duration-300 ${
                            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Progress Bar */}
                        <div
                            ref={progressRef}
                            onClick={handleProgressClick}
                            className="progress-bar mb-4 h-1.5 cursor-pointer bg-slate-700 rounded-full overflow-hidden group"
                        >
                            <div
                                className="progress-fill h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all group-hover:h-2"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            {/* Left Controls */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => dispatch(togglePlay())}
                                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-110 active:scale-95"
                                    title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6" fill="currentColor" />
                                    ) : (
                                        <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                                    )}
                                </button>

                                <button
                                    className="player-control text-white hover:text-indigo-400 transition-colors"
                                    title="Previous (← Arrow)"
                                >
                                    <SkipBack className="w-5 h-5" />
                                </button>

                                <button
                                    className="player-control text-white hover:text-indigo-400 transition-colors"
                                    title="Next (→ Arrow)"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-2 ml-2 group">
                                    <button
                                        onClick={() => dispatch(toggleMute())}
                                        className="player-control text-white hover:text-indigo-400 transition-colors"
                                        title="Mute (M)"
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
                                        className="volume-slider w-24 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Volume (↑/↓)"
                                    />
                                </div>

                                <div className="text-sm text-white font-medium">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </div>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-2">
                                {/* Playlist */}
                                <button
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className="player-control text-white hover:text-indigo-400 transition-colors"
                                    title="Playlist"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>

                                {/* Repeat */}
                                <button
                                    onClick={cycleRepeatMode}
                                    className={`player-control transition-colors ${
                                        repeatMode === 'none'
                                            ? 'text-white hover:text-indigo-400'
                                            : 'text-indigo-400'
                                    }`}
                                    title="Repeat"
                                >
                                    {repeatMode === 'one' ? (
                                        <Repeat1 className="w-5 h-5" />
                                    ) : (
                                        <Repeat className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Subtitles */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSubtitles(!showSubtitles)}
                                        className="player-control text-white hover:text-indigo-400 transition-colors"
                                        title="Subtitles"
                                    >
                                        <Subtitles className="w-5 h-5" />
                                    </button>
                                    {showSubtitles && (
                                        <div className="context-menu bottom-12 right-0 min-w-48">
                                            <div className="context-menu-header">Subtitle Language</div>
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
                                            <div className="context-menu-item">
                                                <input type="checkbox" className="mr-2" />
                                                German
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Audio Tracks */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAudioTracks(!showAudioTracks)}
                                        className="player-control text-white hover:text-indigo-400 transition-colors"
                                        title="Audio Track"
                                    >
                                        <Languages className="w-5 h-5" />
                                    </button>
                                    {showAudioTracks && (
                                        <div className="context-menu bottom-12 right-0 min-w-48">
                                            <div className="context-menu-header">Audio Track</div>
                                            <div className="context-menu-item">
                                                <input type="radio" name="audio" className="mr-2" defaultChecked />
                                                English
                                            </div>
                                            <div className="context-menu-item">
                                                <input type="radio" name="audio" className="mr-2" />
                                                Spanish
                                            </div>
                                            <div className="context-menu-item">
                                                <input type="radio" name="audio" className="mr-2" />
                                                French
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Picture in Picture */}
                                {canPictureInPicture() && (
                                    <button
                                        onClick={handlePictureInPicture}
                                        className={`player-control transition-colors ${
                                            isPictureInPicture
                                                ? 'text-indigo-400'
                                                : 'text-white hover:text-indigo-400'
                                        }`}
                                        title="Picture in Picture"
                                    >
                                        <PictureInPicture className="w-5 h-5" />
                                    </button>
                                )}

                                {/* Settings */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className="player-control text-white hover:text-indigo-400 transition-colors"
                                        title="Settings"
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>
                                    {showSettings && (
                                        <div className="context-menu bottom-12 right-0 min-w-56">
                                            <div className="context-menu-header">Playback Speed</div>
                                            {playbackRates.map((rate) => (
                                                <div
                                                    key={rate}
                                                    onClick={() => {
                                                        dispatch(setPlaybackRate(rate));
                                                        setShowSettings(false);
                                                    }}
                                                    className={`context-menu-item ${
                                                        playbackRate === rate
                                                            ? 'bg-indigo-600 text-white'
                                                            : ''
                                                    }`}
                                                >
                                                    {rate}x
                                                    {rate === 1 && ' (Normal)'}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Fullscreen */}
                                <button
                                    onClick={handleFullscreen}
                                    className="player-control text-white hover:text-indigo-400 transition-colors"
                                    title="Fullscreen (F)"
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
            )}

            {/* AUDIO PLAYBACK FRAME */}
            {mediaType === 'audio' && (
                <div className={`w-full ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'} min-h-screen flex items-center justify-center px-4`}>
                    <div className="w-full max-w-md">
                        {/* Album Art Placeholder */}
                        <div className="mb-8 flex justify-center animate-fade-in">
                            <div className={`w-64 h-64 rounded-2xl ${isDark ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-indigo-600'} flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-shadow`}>
                                <Music className="w-32 h-32 text-white/50" />
                            </div>
                        </div>

                        {/* Audio Info */}
                        <div className="text-center mb-8 animate-fade-in">
                            <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Now Playing
                            </h2>
                            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                                Song Title
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Artist Name
                            </p>
                        </div>

                        {/* Audio Element */}
                        <audio
                            ref={audioRef}
                            className="hidden"
                            src={`http://localhost:5000/api/media/${id}/stream`}
                        />

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div
                                ref={progressRef}
                                onClick={handleProgressClick}
                                className={`progress-bar h-2 cursor-pointer mb-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`}
                            >
                                <div
                                    className="progress-fill h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                            </div>
                            <div className={`flex justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Main Controls */}
                        <div className="flex items-center justify-center gap-8 mb-8">
                            {/* Previous */}
                            <button
                                className={`transition-all hover:scale-110 active:scale-95 ${
                                    isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Previous Track (← Arrow)"
                            >
                                <SkipBack className="w-7 h-7" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={() => dispatch(togglePlay())}
                                className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold transition-all hover:shadow-lg hover:scale-110 active:scale-95 ${
                                    isDark
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-purple-500/50'
                                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:shadow-blue-400/50'
                                }`}
                                title={isPlaying ? 'Pause (Spacebar)' : 'Play (Spacebar)'}
                            >
                                {isPlaying ? (
                                    <Pause className="w-10 h-10 ml-0.5" fill="currentColor" />
                                ) : (
                                    <Play className="w-10 h-10 ml-1" fill="currentColor" />
                                )}
                            </button>

                            {/* Next */}
                            <button
                                className={`transition-all hover:scale-110 active:scale-95 ${
                                    isDark
                                        ? 'text-gray-400 hover:text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Next Track (→ Arrow)"
                            >
                                <SkipForward className="w-7 h-7" />
                            </button>
                        </div>

                        {/* Secondary Controls */}
                        <div className="flex items-center justify-between gap-4 mb-6">
                            {/* Repeat */}
                            <button
                                onClick={cycleRepeatMode}
                                className={`px-3 py-2 rounded transition-all ${
                                    repeatMode === 'none'
                                        ? isDark
                                            ? 'bg-slate-700 text-gray-400'
                                            : 'bg-gray-200 text-gray-600'
                                        : 'bg-indigo-600 text-white'
                                }`}
                                title="Repeat Mode"
                            >
                                {repeatMode === 'one' ? (
                                    <Repeat1 className="w-5 h-5" />
                                ) : (
                                    <Repeat className="w-5 h-5" />
                                )}
                            </button>

                            {/* Volume Control */}
                            <div className={`flex items-center gap-2 flex-1 ${isDark ? 'bg-slate-700/30' : 'bg-gray-200/30'} px-3 py-2 rounded`}>
                                <button
                                    onClick={() => dispatch(toggleMute())}
                                    className={`transition-colors ${
                                        isDark
                                            ? 'text-gray-400 hover:text-white'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                    title="Mute (M)"
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
                                    className="volume-slider flex-1"
                                    title="Volume (↑/↓)"
                                />
                            </div>

                            {/* Playback Speed */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`px-3 py-2 rounded border text-sm font-medium transition-all ${
                                        isDark
                                            ? 'bg-slate-700 text-white border-slate-600 hover:border-indigo-500'
                                            : 'bg-white text-gray-900 border-gray-300 hover:border-blue-500'
                                    }`}
                                    title="Playback Speed"
                                >
                                    {playbackRate}x
                                </button>
                                {showSettings && (
                                    <div className={`context-menu bottom-full right-0 mb-2 ${isDark ? '' : 'light'}`}>
                                        {playbackRates.map((rate) => (
                                            <div
                                                key={rate}
                                                onClick={() => {
                                                    dispatch(setPlaybackRate(rate));
                                                    setShowSettings(false);
                                                }}
                                                className={`context-menu-item ${
                                                    playbackRate === rate
                                                        ? 'bg-indigo-600 text-white'
                                                        : ''
                                                }`}
                                            >
                                                {rate}x
                                                {rate === 1 && ' (Normal)'}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Playlist & Settings */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPlaylist(!showPlaylist)}
                                className={`flex-1 py-2 rounded font-medium transition-all ${
                                    isDark
                                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                }`}
                                title="Playlist"
                            >
                                <Menu className="w-5 h-5 inline mr-2" />
                                Playlist
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`flex-1 py-2 rounded font-medium transition-all ${
                                    isDark
                                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                                }`}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5 inline mr-2" />
                                Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Info (non-fullscreen) */}
            {!isFullscreen && mediaType === 'video' && (
                <div className="mt-6 px-4 animate-fade-in">
                    <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        Video Title
                    </h1>
                    <p className={isDark ? 'text-gray-600' : 'text-gray-600'}>
                        Video description will appear here
                    </p>
                </div>
            )}

            {/* Playlist Manager */}
            <PlaylistManager isOpen={showPlaylist} onClose={() => setShowPlaylist(false)} />

            {/* Settings Panel */}
            <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
};

export default Player;
