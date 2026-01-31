import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Volume1,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    ArrowLeft,
    Music,
    Repeat,
    Repeat1,
    Shuffle,
    ListMusic,
    ChevronDown,
    RotateCcw,

    X,
    Sliders,
    Info,
    Globe,
    Eye,
    MessageSquare,
    Subtitles,
    ExternalLink
} from 'lucide-react';
import Equalizer from './Equalizer';
import useAudioEqualizer from '../../hooks/useAudioEqualizer';
import {
    togglePlay,
    setPlaying,
    setVolume,
    toggleMute,
    setCurrentTime as setPlayerCurrentTime,
    setDuration,
    toggleFullscreen,
    setPlaybackRate,
    toggleAutoPlay,
} from '../../store/slices/playerSlice';
import {
    nextTrack,
    previousTrack,
    toggleShuffle,
    setRepeat,
    setCurrentIndex,
    addToQueue
} from '../../store/slices/playlistSlice';
import { mediaAPI, subtitleAPI } from '../../utils/api';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { formatTime } from '../../utils/helpers';
import { getLocalFileURL } from '../../utils/localStorageUtils';
import { addToRecentlyPlayed } from '../../store/slices/recentlyPlayedSlice';

const Player = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const containerRef = useRef(null);

    // Redux State
    const {
        isPlaying,
        volume,
        isMuted,
        currentTime,
        duration,
        playbackRate,
        isFullscreen,
        autoPlay,
    } = useSelector((state) => state.player);

    const {
        queue,
        currentIndex,
        shuffle,
        repeat,
    } = useSelector((state) => state.playlist);

    const { isDark } = useSelector((state) => state.theme);

    // Local State
    const [showSettings, setShowSettings] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentMediaUrl, setCurrentMediaUrl] = useState(null);
    const [showCentralIcon, setShowCentralIcon] = useState(false);
    const [centralIconType, setCentralIconType] = useState('play');
    const controlsTimeoutRef = useRef(null);
    const [showEqualizer, setShowEqualizer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMediaInfo, setShowMediaInfo] = useState(false);
    const [isExtractingSubs, setIsExtractingSubs] = useState(false);
    const [extractMsg, setExtractMsg] = useState('');

    const currentTrack = useMemo(() => {
        if (queue && queue.length > currentIndex && currentIndex >= 0) {
            return queue[currentIndex];
        }
        return null;
    }, [queue, currentIndex]);

    const isVideo = currentTrack?.type === 'video';

    // Equalizer Hook
    const equalizer = useAudioEqualizer(isVideo ? videoRef : audioRef, currentTrack?.id);

    // Enable keyboard shortcuts
    useKeyboardShortcuts();

    const triggerCentralIcon = (type) => {
        setCentralIconType(type);
        setShowCentralIcon(true);
        setTimeout(() => setShowCentralIcon(false), 500);
    };

    // ... (rest of the file) ...

    // Playback control effects
    useEffect(() => {
        const media = isVideo ? videoRef.current : audioRef.current;
        if (!media || !currentMediaUrl) return;
        if (isPlaying) {
            media.play().catch(err => {
                // Ignore AbortError which happens when unloading/navigating quickly
                if (err.name !== 'AbortError') {
                    console.error('Playback failed:', err);
                }
            });
        } else {
            media.pause();
        }
    }, [isPlaying, isVideo, currentMediaUrl]);

    // 1. Sync URL (`id`) -> Redux (`currentIndex`)
    // Only run when `id` changes (navigation/link click)
    useEffect(() => {
        if (!id || !queue.length) {
            setIsLoading(false);
            return;
        }

        const indexInQueue = queue.findIndex(track => track.id === id);

        if (indexInQueue !== -1) {
            // URL points to valid track in queue -> Sync Redux
            if (currentIndex !== indexInQueue) {
                dispatch(setCurrentIndex(indexInQueue));
            }
            setIsLoading(false);
        } else {
            // URL points to track NOT in queue -> Fetch & Add
            const fetchAndPlay = async () => {
                setIsLoading(true);
                setError(null);

                // If it's a local ID and not in queue, we can't fetch it from backend
                if (id.startsWith('local_')) {
                    setError('Local media session expired. Please play again from the library.');
                    setIsLoading(false);
                    return;
                }

                try {
                    const response = await mediaAPI.getById(id);
                    const media = {
                        ...response.data,
                        source: 'uploaded'
                    };

                    // Add to queue and set as current
                    dispatch(addToQueue(media));
                    // The new item will be at the end of the queue
                    dispatch(setCurrentIndex(queue.length));
                } catch (err) {
                    console.error('Failed to fetch media by ID:', err);
                    setError('Media not found or could not be loaded.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchAndPlay();
        }
    }, [id, queue.length, dispatch]); // Removed `currentIndex`, `queue` (referencing length is safer to avoid loops)

    // 2. Sync Redux (`currentIndex`) -> URL
    // When track changes internally (next/prev), update URL
    useEffect(() => {
        if (!currentTrack) return;

        // Only navigate if the ID matches a valid track and is different from current URL
        if (currentTrack.id && currentTrack.id !== id) {
            navigate(`/player/${currentTrack.id}`, { replace: true });
        }
    }, [currentIndex, currentTrack?.id, navigate]); // Removed `id` from dep to avoid fighting

    // 3. Load Media Source
    // Runs when `currentTrack` changes (either from ID sync or Redux change)
    useEffect(() => {
        let isMounted = true;
        const loadUrl = async () => {
            if (!currentTrack) return;
            try {
                let url;
                if (currentTrack.source === 'local') {
                    url = await getLocalFileURL(currentTrack);
                } else if (currentTrack.id) {
                    url = mediaAPI.stream(currentTrack.id);
                }

                if (isMounted) {
                    if (!url) {
                        setError('Could not access media file.');
                    } else {
                        setCurrentMediaUrl(url);
                        dispatch(addToRecentlyPlayed(currentTrack));
                        setError(null); // Clear error on success
                    }
                }
            } catch (err) {
                console.error('Error loading media URL:', err);
                if (isMounted) setError('Error accessing local file handle. Please re-add the folder or try playing again.');
            }
        };
        loadUrl();
        return () => { isMounted = false; };
    }, [currentTrack]); // Only depend on the track object itself

    // Position handles
    useEffect(() => {
        if (!currentTrack) return;
        const resumeKey = currentTrack.source === 'local' ? `resume_${currentTrack.name}_${currentTrack.size}` : `resume_${currentTrack.id}`;
        const savedPos = localStorage.getItem(resumeKey);
        if (savedPos) {
            const time = parseFloat(savedPos);
            const media = isVideo ? videoRef.current : audioRef.current;
            if (media) {
                media.currentTime = time;
                dispatch(setPlayerCurrentTime(time));
            }
        }
    }, [currentTrack?.id, isVideo, dispatch]);

    useEffect(() => {
        if (!currentTrack || isNaN(currentTime) || duration <= 0) return;
        const resumeKey = currentTrack.source === 'local' ? `resume_${currentTrack.name}_${currentTrack.size}` : `resume_${currentTrack.id}`;
        const handleSave = () => {
            if (currentTime > 5 && currentTime < duration - 5) {
                localStorage.setItem(resumeKey, currentTime.toString());
            } else if (currentTime >= duration - 5) {
                localStorage.removeItem(resumeKey);
            }
        };
        const interval = setInterval(handleSave, 3000);
        return () => clearInterval(interval);
    }, [currentTrack?.id, currentTime, duration]);

    // Media element listeners
    const setupListeners = (media) => {
        if (!media) return;
        const handleTimeUpdate = () => dispatch(setPlayerCurrentTime(media.currentTime));
        const handleLoadedMetadata = () => dispatch(setDuration(media.duration));
        const handleEnded = () => {
            if (repeat === 'one') {
                media.currentTime = 0;
                media.play();
            } else if (repeat === 'all' || autoPlay) {
                dispatch(nextTrack());
                dispatch(setPlaying(true));
            } else {
                dispatch(setPlaying(false));
            }
        };
        media.addEventListener('timeupdate', handleTimeUpdate);
        media.addEventListener('loadedmetadata', handleLoadedMetadata);
        media.addEventListener('ended', handleEnded);
        return () => {
            media.removeEventListener('timeupdate', handleTimeUpdate);
            media.removeEventListener('loadedmetadata', handleLoadedMetadata);
            media.removeEventListener('ended', handleEnded);
        };
    };

    useEffect(() => {
        const video = videoRef.current;
        if (isVideo && video) return setupListeners(video);
    }, [isVideo, currentMediaUrl, repeat, dispatch]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!isVideo && audio) return setupListeners(audio);
    }, [isVideo, currentMediaUrl, repeat, dispatch]);

    // Playback control effects
    useEffect(() => {
        const media = isVideo ? videoRef.current : audioRef.current;
        if (!media || !currentMediaUrl) return;
        if (isPlaying) {
            media.play().catch(err => {
                // Ignore AbortError which happens when unloading/navigating quickly
                if (err.name !== 'AbortError') {
                    console.error('Playback failed:', err);
                }
            });
        } else {
            media.pause();
        }
    }, [isPlaying, isVideo, currentMediaUrl]);

    useEffect(() => {
        const media = isVideo ? videoRef.current : audioRef.current;
        if (media) media.volume = isMuted ? 0 : volume;
    }, [volume, isMuted, isVideo, currentMediaUrl]);

    useEffect(() => {
        const media = isVideo ? videoRef.current : audioRef.current;
        if (media) media.playbackRate = playbackRate;
    }, [playbackRate, isVideo, currentMediaUrl]);

    // Auto-hide controls
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                if (!showPlaylist && !showSettings) setShowControls(false);
            }, 3000);
        }
    }, [isPlaying, showPlaylist, showSettings]);

    useEffect(() => {
        const handleActivity = () => resetControlsTimeout();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            clearTimeout(controlsTimeoutRef.current);
        };
    }, [resetControlsTimeout]);

    const handleProgressChange = (e) => {
        const media = isVideo ? videoRef.current : audioRef.current;
        if (media && duration > 0) {
            const newTime = parseFloat(e.target.value);
            media.currentTime = newTime;
            dispatch(setPlayerCurrentTime(newTime));
        }
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            dispatch(toggleFullscreen());
        } else {
            document.exitFullscreen();
            dispatch(toggleFullscreen());
        }
    };

    const togglePlayPause = () => {
        dispatch(togglePlay());
        triggerCentralIcon(isPlaying ? 'pause' : 'play');
    };

    const cycleRepeatMode = () => {
        const modes = ['none', 'all', 'one'];
        const nextIdx = (modes.indexOf(repeat) + 1) % modes.length;
        dispatch(setRepeat(modes[nextIdx]));
    };

    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

    const handleExtractSubtitles = async () => {
        if (!currentTrack?.id || currentTrack.source === 'local') return;
        setIsExtractingSubs(true);
        setExtractMsg('Extracting...');
        try {
            const { data } = await subtitleAPI.extract(currentTrack.id);
            setExtractMsg(data.count > 0 ? `Success: ${data.count} found` : data.message);
            // Refresh current track info
            const response = await mediaAPI.getById(currentTrack.id);
            const updatedMedia = { ...response.data, source: 'uploaded' };
            // Update in queue
            const newQueue = [...queue];
            newQueue[currentIndex] = updatedMedia;
            dispatch(setQueue(newQueue));
        } catch (err) {
            setExtractMsg('Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsExtractingSubs(false);
            setTimeout(() => setExtractMsg(''), 5000);
        }
    };

    return (
        <div ref={containerRef} className={`relative w-full h-screen overflow-hidden bg-black select-none ${isDark ? 'dark' : ''} ${!showControls && isPlaying ? 'cursor-none' : 'cursor-default'}`}>

            {/* Background for Audio Mode */}
            {!isVideo && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTrack?.id || 'empty'}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: currentTrack?.thumbnail
                                ? `url(${currentTrack.thumbnail})`
                                : 'linear-gradient(to bottom right, #1e3a8a, #581c87)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(100px) saturate(2)',
                        }}
                    />
                </AnimatePresence>
            )}

            <div className="relative z-10 flex flex-col h-full">

                {/* Header Overlay */}
                <header className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 z-30 ${!showControls && isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-3 rounded-full hover:bg-white/10 text-white transition-all active:scale-90"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col gap-1 max-w-md">
                            <h1 className="text-white text-lg font-medium truncate drop-shadow-md">
                                {currentTrack?.title || 'Unknown Track'}
                            </h1>
                            <span className="text-gray-300 text-xs uppercase tracking-widest font-semibold opacity-60">
                                {currentTrack?.metadata?.artist || currentTrack?.artist || 'Unknown Artist'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMediaInfo(!showMediaInfo)}
                            className={`p-3 rounded-full transition-all ${showMediaInfo ? 'bg-primary-600 text-white' : 'text-white hover:bg-white/10'}`}
                            title="Media Info"
                        >
                            <Info className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setShowPlaylist(!showPlaylist)}
                            className={`p-3 rounded-full transition-all ${showPlaylist ? 'bg-red-600 text-white' : 'text-white hover:bg-white/10'}`}
                            title="Queue"
                        >
                            <ListMusic className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                {/* Main Viewport */}
                <main
                    className="flex-1 flex flex-col items-center justify-center relative cursor-pointer"
                    onClick={(e) => {
                        if (e.target.closest('button, input, .player-controls')) return;
                        togglePlayPause();
                    }}
                >
                    {isVideo ? (
                        <div className="w-full h-full bg-black">
                            <video
                                key={currentTrack?.id}
                                ref={videoRef}
                                src={currentMediaUrl}
                                preload="metadata"
                                crossOrigin={currentMediaUrl?.startsWith('blob:') ? undefined : "anonymous"}
                                className="w-full h-full object-contain pointer-events-none"
                            />
                        </div>
                    ) : (
                        <motion.div
                            key={currentTrack?.id}
                            initial={{ y: 30, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            className="flex flex-col items-center max-w-5xl w-full"
                        >
                            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-12 group">
                                <motion.div
                                    animate={{ rotate: isPlaying ? 360 : 0 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-red-600/20 blur-[80px] rounded-full"
                                />
                                <div className={`relative w-full h-full rounded-[32px] overflow-hidden shadow-2xl bg-gray-900 flex items-center justify-center border border-white/10 ${isPlaying ? 'animate-float' : ''}`}>
                                    {currentTrack?.thumbnail ? (
                                        <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Music className="w-32 h-32 text-red-600" strokeWidth={1.5} />
                                    )}
                                </div>
                            </div>
                            <audio ref={audioRef} src={currentMediaUrl} crossOrigin={currentMediaUrl?.startsWith('blob:') ? undefined : "anonymous"} />
                        </motion.div>
                    )}

                    {/* Equalizer Overlay */}
                    <Equalizer
                        isOpen={showEqualizer}
                        onClose={() => setShowEqualizer(false)}
                        equalizer={equalizer}
                    />

                    {/* Central Animation Icon */}
                    <AnimatePresence>
                        {showCentralIcon && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1.5 }}
                                exit={{ opacity: 0, scale: 2 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                            >
                                <div className="bg-black/40 p-10 rounded-full backdrop-blur-sm">
                                    {centralIconType === 'play' && <Play className="w-16 h-16 text-white fill-white" />}
                                    {centralIconType === 'pause' && <Pause className="w-16 h-16 text-white fill-white" />}
                                    {centralIconType === 'rewind' && <RotateCcw className="w-16 h-16 text-white" />}
                                    {centralIconType === 'forward' && <SkipForward className="w-16 h-16 text-white fill-white" />}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading/Error State Overlay */}
                    {(isLoading || error || !currentTrack) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 text-center p-6">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-400 font-medium">Loading Media...</p>
                                </div>
                            ) : error ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-md"
                                >
                                    <X className="w-16 h-16 text-red-600 mx-auto mb-4 opacity-50" />
                                    <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
                                    <p className="text-gray-400 mb-8">{error}</p>
                                    <button
                                        onClick={() => navigate('/library')}
                                        className="px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        Back to Library
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-md"
                                >
                                    <Music className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
                                    <h2 className="text-2xl font-bold text-white mb-2">No Media Selected</h2>
                                    <p className="text-gray-400 mb-8">Please select a track from your library to start playing.</p>
                                    <button
                                        onClick={() => navigate('/library')}
                                        className="px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        Go to Library
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </main>

                {/* Footer Controls - YouTube Style */}
                <footer className={`player-controls absolute bottom-0 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-30 ${(isVideo && !showControls && isPlaying) ? 'opacity-0' : 'opacity-100'}`}>

                    {/* YouTube Progress Bar */}
                    <div className="group/progress relative w-full h-8 flex items-center cursor-pointer mb-1">
                        <div className="absolute w-full h-1 bg-white/20 rounded-full transition-all group-hover/progress:h-1.5" />
                        <div
                            className="absolute h-1 bg-red-600 rounded-full transition-all group-hover/progress:h-1.5"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg ring-2 ring-black" />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.01"
                            value={currentTime}
                            onChange={handleProgressChange}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between mx-2">
                        <div className="flex items-center gap-5">
                            <button onClick={() => dispatch(previousTrack())} className="text-white hover:scale-110 transition-transform">
                                <SkipBack className="w-7 h-7 fill-white" />
                            </button>

                            <button onClick={togglePlayPause} className="text-white hover:scale-110 transition-transform">
                                {isPlaying ? <Pause className="w-9 h-9 fill-white" /> : <Play className="w-9 h-9 fill-white" />}
                            </button>

                            <button onClick={() => dispatch(nextTrack())} className="text-white hover:scale-110 transition-transform">
                                <SkipForward className="w-7 h-7 fill-white" />
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume ml-1">
                                <button onClick={() => dispatch(toggleMute())} className="text-white">
                                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : volume < 0.5 ? <Volume1 className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 flex items-center">
                                    <input
                                        type="range" min="0" max="1" step="0.01"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                                        className="w-20 h-1 bg-white/20 accent-white cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Time */}
                            <div className="text-white text-[13px] font-medium ml-2 font-sans tracking-wide">
                                <span>{formatTime(currentTime)}</span>
                                <span className="mx-1 text-gray-400">/</span>
                                <span className="text-gray-300">{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <button onClick={() => dispatch(toggleShuffle())} className={`transition-colors ${shuffle ? 'text-red-500' : 'text-white/60 hover:text-white'}`}>
                                <Shuffle className="w-5 h-5" />
                            </button>

                            <button onClick={cycleRepeatMode} className={`transition-colors ${repeat !== 'none' ? 'text-red-500' : 'text-white/60 hover:text-white'}`}>
                                {repeat === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                            </button>

                            {/* Speed Settings */}
                            <div className="relative">
                                <button onClick={() => setShowSettings(!showSettings)} className="text-white hover:rotate-45 transition-transform flex items-center gap-1">
                                    <Settings className="w-6 h-6" />
                                    <span className="text-xs font-bold w-6">{playbackRate}x</span>
                                </button>
                                <AnimatePresence>
                                    {showSettings && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full right-0 mb-4 bg-[#111] border border-white/10 rounded-xl min-w-[160px] overflow-hidden shadow-2xl"
                                        >
                                            <div className="p-3 border-b border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Speed Selection</div>
                                            {playbackRates.map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => { dispatch(setPlaybackRate(rate)); setShowSettings(false); }}
                                                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${playbackRate === rate ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                                                >
                                                    {rate}x {rate === 1 && '(Normal)'}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button onClick={handleFullscreen} className="text-white hover:scale-110 transition-transform">
                                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={() => setShowEqualizer(!showEqualizer)}
                                className={`transition-colors ${showEqualizer ? 'text-red-500' : 'text-white hover:text-white/80'}`}
                                title="Equalizer"
                            >
                                <Sliders className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Media Information Drawer */}
            <AnimatePresence>
                {showMediaInfo && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMediaInfo(false)}
                            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 bottom-0 w-full max-w-md z-50 bg-[#0f0f0f] border-l border-white/10 flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary-900/20 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
                                        <Info className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <span className="text-lg font-bold text-white tracking-tight">Media Details</span>
                                </div>
                                <button onClick={() => setShowMediaInfo(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                                {/* Thumbnail & Basic Info */}
                                <div className="space-y-4">
                                    {currentTrack?.thumbnail && (
                                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/5 relative group">
                                            <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-bold text-white leading-tight">{currentTrack?.title}</h2>
                                        <p className="text-primary-400 font-medium mt-1">{currentTrack?.metadata?.artist || currentTrack?.artist || 'Unknown Artist'}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Views</span>
                                        </div>
                                        <p className="text-white font-mono text-lg">{currentTrack?.metadata?.views?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                                            <Globe className="w-3.5 h-3.5" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Format</span>
                                        </div>
                                        <p className="text-white font-mono text-lg uppercase">{currentTrack?.format || 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Description */}
                                {currentTrack?.metadata?.description && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="text-sm font-bold uppercase tracking-widest text-[11px]">Description</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <p className="text-sm text-gray-400 leading-relaxed italic">
                                                "{currentTrack.metadata.description}"
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Source Link */}
                                {currentTrack?.metadata?.originalUrl && (
                                    <a
                                        href={currentTrack.metadata.originalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-2xl bg-primary-600/10 border border-primary-500/20 group hover:bg-primary-600/20 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-5 h-5 text-primary-400" />
                                            <span className="text-sm font-medium text-white">Original Source</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-primary-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                )}

                                {/* Subtitle Extraction */}
                                {currentTrack?.source !== 'local' && (
                                    <div className="pt-4 border-t border-white/10">
                                        <div className="flex flex-col gap-4">
                                            <button
                                                onClick={handleExtractSubtitles}
                                                disabled={isExtractingSubs}
                                                className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all ${isExtractingSubs
                                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                    : 'bg-white text-black hover:bg-primary-500 hover:text-white shadow-lg'
                                                    }`}
                                            >
                                                {isExtractingSubs ? (
                                                    <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Subtitles className="w-5 h-5" />
                                                )}
                                                {isExtractingSubs ? 'Processing Subtitles...' : 'Extract Subtitles'}
                                            </button>
                                            {extractMsg && (
                                                <p className="text-center text-xs font-medium text-primary-400 animate-pulse">
                                                    {extractMsg}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Playlist Drawer */}
            <AnimatePresence>
                {showPlaylist && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPlaylist(false)}
                            className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 bottom-0 w-full max-w-sm z-50 bg-[#0f0f0f] border-l border-white/10 flex flex-col shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <span className="text-lg font-bold text-white">Playback Queue</span>
                                <button onClick={() => setShowPlaylist(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {queue.map((item, index) => (
                                    <button
                                        key={`${item.id}-${index}`}
                                        onClick={() => {
                                            dispatch(setCurrentIndex(index));
                                            dispatch(setPlaying(true));
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${index === currentIndex ? 'bg-red-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                                    >
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 flex-shrink-0">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    <Music className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left truncate">
                                            <p className="font-semibold truncate text-sm">{item.title}</p>
                                            <p className={`text-[11px] opacity-60 truncate ${index === currentIndex ? 'text-white' : ''}`}>{item.artist}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence >

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
            `}</style>
        </div>
    );
};

export default Player;
