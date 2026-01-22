import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    togglePlay,
    setVolume,
    toggleMute,
    setCurrentTime,
    toggleFullscreen,
    setPlaybackRate,
} from '../store/slices/playerSlice';

const useKeyboardShortcuts = () => {
    const dispatch = useDispatch();
    const { isPlaying, volume, duration, currentTime, playbackRate } = useSelector(
        (state) => state.player
    );

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Check if input is focused - don't trigger shortcuts
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            switch (e.code) {
                // Spacebar - Play/Pause
                case 'Space':
                    e.preventDefault();
                    dispatch(togglePlay());
                    break;

                // Arrow Left - Seek backward 5 seconds
                case 'ArrowLeft':
                    e.preventDefault();
                    dispatch(setCurrentTime(Math.max(0, currentTime - 5)));
                    break;

                // Arrow Right - Seek forward 5 seconds
                case 'ArrowRight':
                    e.preventDefault();
                    dispatch(setCurrentTime(Math.min(duration, currentTime + 5)));
                    break;

                // Arrow Up - Increase volume
                case 'ArrowUp':
                    e.preventDefault();
                    dispatch(setVolume(Math.min(1, volume + 0.1)));
                    break;

                // Arrow Down - Decrease volume
                case 'ArrowDown':
                    e.preventDefault();
                    dispatch(setVolume(Math.max(0, volume - 0.1)));
                    break;

                // 'M' - Mute/Unmute
                case 'KeyM':
                    e.preventDefault();
                    dispatch(toggleMute());
                    break;

                // 'F' - Fullscreen (only for video)
                case 'KeyF':
                    e.preventDefault();
                    dispatch(toggleFullscreen());
                    break;

                // '>' - Increase playback speed
                case 'Period':
                    if (e.shiftKey) {
                        e.preventDefault();
                        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                        const currentIndex = rates.indexOf(playbackRate);
                        if (currentIndex < rates.length - 1) {
                            dispatch(setPlaybackRate(rates[currentIndex + 1]));
                        }
                    }
                    break;

                // '<' - Decrease playback speed
                case 'Comma':
                    if (e.shiftKey) {
                        e.preventDefault();
                        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                        const currentIndex = rates.indexOf(playbackRate);
                        if (currentIndex > 0) {
                            dispatch(setPlaybackRate(rates[currentIndex - 1]));
                        }
                    }
                    break;

                // '0-9' - Jump to percentage
                case 'Digit0':
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9':
                    e.preventDefault();
                    const digit = parseInt(e.code.replace('Digit', ''));
                    const percentage = digit === 0 ? 0 : digit / 10;
                    dispatch(setCurrentTime(duration * percentage));
                    break;

                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [dispatch, isPlaying, volume, duration, currentTime, playbackRate]);
};

export default useKeyboardShortcuts;
