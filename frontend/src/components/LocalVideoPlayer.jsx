import React, { useRef, useEffect, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle, Loader, SkipBack, SkipForward, Settings } from 'lucide-react';
import { revokeLocalFileURL } from '../utils/localStorageUtils';

const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'ogv', 'm4v'];
const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'wma', 'opus', 'ape'];

// MIME type mapping for common formats
const MIME_TYPES = {
    // Video formats
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    ogv: 'video/ogg',
    m4v: 'video/x-m4v',
    '3gp': 'video/3gpp',
    // Audio formats
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    wma: 'audio/x-ms-wma',
    opus: 'audio/opus',
    ape: 'audio/x-ape',
};

const LocalVideoPlayer = ({ file, url, onClose, isAudio = false }) => {
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const controlsTimeoutRef = useRef(null);
    const containerRef = useRef(null);

    const mediaRef = isAudio ? audioRef : videoRef;

    // Get file extension
    const getFileExtension = (filename) => {
        return filename.split('.').pop().toLowerCase();
    };

    // Get MIME type from file extension
    const getMimeType = () => {
        const ext = getFileExtension(file.name);
        return MIME_TYPES[ext] || '';
    };

    // Check if format is supported
    const isFormatSupported = () => {
        const ext = getFileExtension(file.name);
        if (isAudio) {
            return SUPPORTED_AUDIO_FORMATS.includes(ext);
        } else {
            return SUPPORTED_VIDEO_FORMATS.includes(ext);
        }
    };

    // Handle play/pause
    const handlePlayPause = () => {
        if (mediaRef.current && !hasError) {
            if (isPlaying) {
                mediaRef.current.pause();
                setIsPlaying(false);
            } else {
                mediaRef.current.play().catch(err => {
                    console.error('Error playing media:', err);
                    setHasError(true);
                    setErrorMessage('Unable to play media. Please check browser support for this format.');
                });
            }
        }
    };

    // Handle time update
    const handleTimeUpdate = () => {
        if (mediaRef.current) {
            setCurrentTime(mediaRef.current.currentTime);
        }
    };

    // Handle metadata loaded
    const handleLoadedMetadata = () => {
        if (mediaRef.current) {
            setDuration(mediaRef.current.duration);
            setIsLoading(false);
        }
    };

    // Handle can play
    const handleCanPlay = () => {
        setIsLoading(false);
    };

    // Handle progress bar change
    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        if (mediaRef.current) {
            mediaRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    // Handle volume change
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (mediaRef.current) {
            mediaRef.current.volume = newVolume;
        }
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    // Handle mute
    const handleMute = () => {
        if (mediaRef.current) {
            if (isMuted) {
                mediaRef.current.volume = volume;
                setIsMuted(false);
            } else {
                mediaRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    // Handle playback rate
    const handlePlaybackRate = (rate) => {
        if (mediaRef.current) {
            mediaRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    // Handle fullscreen (video only)
    const handleFullscreen = async () => {
        if (!isAudio && containerRef.current) {
            try {
                if (!document.fullscreenElement) {
                    await containerRef.current.requestFullscreen().catch(err => {
                        console.warn('Fullscreen request failed:', err);
                    });
                } else {
                    await document.exitFullscreen();
                }
            } catch (err) {
                console.error('Fullscreen error:', err);
            }
        }
    };

    // Handle keyboard shortcuts
    const handleKeyPress = (e) => {
        if (e.key === ' ') {
            e.preventDefault();
            handlePlayPause();
        } else if (e.key === 'f' || e.key === 'F') {
            handleFullscreen();
        } else if (e.key === 'm' || e.key === 'M') {
            handleMute();
        } else if (e.key === 'ArrowLeft') {
            if (mediaRef.current) mediaRef.current.currentTime = Math.max(0, currentTime - 5);
        } else if (e.key === 'ArrowRight') {
            if (mediaRef.current) mediaRef.current.currentTime = Math.min(duration, currentTime + 5);
        }
    };

    // Auto hide controls
    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying && !isAudio) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Format time
    const formatTime = (time) => {
        if (!time || isNaN(time)) return '0:00';
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    // Handle media ended
    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (mediaRef.current) {
            mediaRef.current.currentTime = 0;
        }
    };

    // Handle error
    const handleMediaError = (e) => {
        console.error('Media error:', e);
        setHasError(true);
        setIsLoading(false);
        
        const error = mediaRef.current?.error;
        if (error) {
            switch(error.code) {
                case error.MEDIA_ERR_ABORTED:
                    setErrorMessage('Playback was aborted.');
                    break;
                case error.MEDIA_ERR_NETWORK:
                    setErrorMessage('A network error occurred.');
                    break;
                case error.MEDIA_ERR_DECODE:
                    setErrorMessage('The media could not be decoded. Format may not be supported.');
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    setErrorMessage('The media source is not supported by your browser.');
                    break;
                default:
                    setErrorMessage('An unknown error occurred while playing media.');
            }
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (url) {
                revokeLocalFileURL(url);
            }
            if (mediaRef.current) {
                mediaRef.current.pause();
                mediaRef.current.src = '';
            }
        };
    }, [url]);

    // Setup media listeners
    useEffect(() => {
        const media = mediaRef.current;
        if (!media) return;

        media.addEventListener('timeupdate', handleTimeUpdate);
        media.addEventListener('loadedmetadata', handleLoadedMetadata);
        media.addEventListener('canplay', handleCanPlay);
        media.addEventListener('ended', handleEnded);
        media.addEventListener('error', handleMediaError);

        return () => {
            media.removeEventListener('timeupdate', handleTimeUpdate);
            media.removeEventListener('loadedmetadata', handleLoadedMetadata);
            media.removeEventListener('canplay', handleCanPlay);
            media.removeEventListener('ended', handleEnded);
            media.removeEventListener('error', handleMediaError);
        };
    }, []);

    // Add keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, hasError, currentTime, duration]);

    if (!url) return null;

    // Error state
    if (hasError || !isFormatSupported()) {
        return (
            <div 
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                onClick={onClose}
            >
                <div 
                    className="bg-gray-900 rounded-lg p-8 max-w-md text-center"
                    onClick={e => e.stopPropagation()}
                >
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Cannot Play Media</h2>
                    <p className="text-gray-300 mb-4">
                        {!isFormatSupported() 
                            ? `Format not supported. Supported ${isAudio ? 'audio' : 'video'} formats: ${isAudio ? SUPPORTED_AUDIO_FORMATS.join(', ').toUpperCase() : SUPPORTED_VIDEO_FORMATS.join(', ').toUpperCase()}`
                            : errorMessage
                        }
                    </p>
                    <button
                        onClick={onClose}
                        className="btn btn-primary w-full"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${isAudio ? 'flex-col' : ''}`}
            onMouseMove={resetControlsTimeout}
            tabIndex={0}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-4 right-4 z-10 p-2 bg-black/70 hover:bg-black rounded-lg transition ${
                    !showControls && !isAudio ? 'opacity-0 pointer-events-none' : ''
                }`}
                title="Close (ESC)"
            >
                <X className="w-6 h-6 text-white" />
            </button>

            {/* Video Player */}
            {!isAudio && (
                <video
                    ref={videoRef}
                    src={url}
                    type={getMimeType()}
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={handleCanPlay}
                />
            )}

            {/* Audio Player */}
            {isAudio && (
                <div className="w-full h-full flex items-center justify-center">
                    <audio
                        ref={audioRef}
                        src={url}
                        type={getMimeType()}
                        onLoadedMetadata={handleLoadedMetadata}
                        onCanPlay={handleCanPlay}
                    />
                    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-8 mb-8 shadow-lg">
                        <Play className="w-16 h-16 text-white mx-auto" />
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !isAudio && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                        <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                        <p className="text-white">Loading...</p>
                    </div>
                </div>
            )}

            {/* Controls (Video) */}
            {!isAudio && (
                <div
                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 py-8 transition-opacity duration-300 ${
                        !showControls && isPlaying ? 'opacity-0' : 'opacity-100'
                    }`}
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => isPlaying && setShowControls(false)}
                >
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-4 group">
                        <span className="text-white text-xs min-w-12 font-mono">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleProgressChange}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
                            title="Seek"
                        />
                        <span className="text-white text-xs min-w-12 text-right font-mono">{formatTime(duration)}</span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Play/Pause */}
                            <button
                                onClick={handlePlayPause}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white hover:scale-110 transform"
                                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 fill-white" />
                                ) : (
                                    <Play className="w-5 h-5 fill-white" />
                                )}
                            </button>

                            {/* Skip buttons */}
                            <button
                                onClick={() => {
                                    if (mediaRef.current) {
                                        mediaRef.current.currentTime = Math.max(0, currentTime - 10);
                                    }
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                title="Rewind 10s"
                            >
                                <SkipBack className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => {
                                    if (mediaRef.current) {
                                        mediaRef.current.currentTime = Math.min(duration, currentTime + 10);
                                    }
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                title="Forward 10s"
                            >
                                <SkipForward className="w-4 h-4" />
                            </button>

                            {/* Volume Control */}
                            <div className="flex items-center gap-2 ml-2">
                                <button
                                    onClick={handleMute}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                    title={isMuted ? 'Unmute' : 'Mute (M)'}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="h-1 w-0 bg-gray-600 rounded-lg hover:w-24 transition-all appearance-none cursor-pointer accent-blue-500"
                                    title="Volume"
                                />
                            </div>

                            {/* File Name */}
                            <span className="text-white text-sm ml-4 truncate max-w-xs hidden lg:inline">
                                {file.title || file.name}
                            </span>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                            {/* Settings/Playback Rate */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                    title="Playback speed"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                
                                {showSettings && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg z-10">
                                        <div className="p-2 space-y-1">
                                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => {
                                                        handlePlaybackRate(rate);
                                                        setShowSettings(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 rounded text-sm transition ${
                                                        playbackRate === rate
                                                            ? 'bg-blue-500 text-white'
                                                            : 'text-gray-300 hover:bg-gray-800'
                                                    }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={handleFullscreen}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white hover:scale-110 transform"
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
            )}

            {/* Audio Player Controls */}
            {isAudio && (
                <div className="w-full max-w-2xl px-8">
                    {/* File Info */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white truncate">{file.title || file.name}</h2>
                        {file.artist && file.artist !== 'Unknown Artist' && (
                            <p className="text-gray-400 mt-2">{file.artist}</p>
                        )}
                        {file.album && (
                            <p className="text-gray-500 text-sm mt-1">{file.album}</p>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-white text-xs min-w-12 font-mono">{formatTime(currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={handleProgressChange}
                                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="text-white text-xs min-w-12 text-right font-mono">{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={handlePlayPause}
                                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition text-white hover:scale-110 transform"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 fill-white" />
                                ) : (
                                    <Play className="w-6 h-6 fill-white" />
                                )}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleMute}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="h-1 w-24 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocalVideoPlayer;
