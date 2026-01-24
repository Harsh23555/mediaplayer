import { useRef, useEffect, useState, useCallback } from 'react';

const BANDS = [
    { frequency: 60, type: 'lowshelf', label: 'Sub-Bass' },
    { frequency: 170, type: 'peaking', label: 'Bass' },
    { frequency: 310, type: 'peaking', label: 'Low-Mid' },
    { frequency: 600, type: 'peaking', label: 'Midrange' },
    { frequency: 1000, type: 'peaking', label: 'Upper-Mid' },
    { frequency: 3000, type: 'peaking', label: 'Presence' },
    { frequency: 12000, type: 'highshelf', label: 'Treble' },
];

export const PRESETS = {
    Normal: [0, 0, 0, 0, 0, 0, 0],
    Pop: [-2, -1, 2, 3, 2, -1, -2],
    Rock: [4, 3, -2, -3, -1, 3, 4],
    Jazz: [3, 2, -2, -2, -1, 2, 3],
    Classical: [4, 3, 2, 1, -1, -2, -4],
    'Hip-Hop': [5, 4, 1, -1, -1, 2, 2],
    Electronic: [4, 3, 0, -1, 2, 3, 4],
    'Vocal Boost': [-2, -2, -1, 3, 4, 3, 1],
    'Bass Boost': [6, 5, 2, -1, -2, -3, -1],
};

const useAudioEqualizer = (mediaElementRef, trackId) => {
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const filtersRef = useRef([]);
    const preampNodeRef = useRef(null);
    const balanceNodeRef = useRef(null);
    const connectedElementRef = useRef(null);

    const [isInitialized, setIsInitialized] = useState(false);

    // UI State
    const [gains, setGains] = useState(new Array(BANDS.length).fill(0));
    const [preampGain, setPreampGain] = useState(0);
    const [balance, setBalance] = useState(0);

    const connectAudio = useCallback(() => {
        const media = mediaElementRef.current;
        if (!media) return;

        // Reset if track changed or context is invalid
        if (connectedElementRef.current !== media || (audioContextRef.current && audioContextRef.current.state === 'closed')) {
            connectedElementRef.current = null;
        }

        // If already connected to this specific element instance and context is good, just ensure running
        if (connectedElementRef.current === media && audioContextRef.current && audioContextRef.current.state !== 'closed') {
            return;
        }

        try {
            // 1. Initialize Context & Static Graph (Runs once or if context was closed)
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();

                // Create Nodes
                const preamp = audioContextRef.current.createGain();
                preamp.gain.value = 1;
                preampNodeRef.current = preamp;

                const panner = audioContextRef.current.createStereoPanner();
                balanceNodeRef.current = panner;

                filtersRef.current = BANDS.map(band => {
                    const filter = audioContextRef.current.createBiquadFilter();
                    filter.type = band.type;
                    filter.frequency.value = band.frequency;
                    filter.gain.value = 0;
                    return filter;
                });

                // Connect Static Chain: Preamp -> Balance -> Filters... -> Destination
                let node = preamp;
                node.connect(panner);
                node = panner;
                filtersRef.current.forEach(filter => {
                    node.connect(filter);
                    node = filter;
                });
                node.connect(audioContextRef.current.destination);
            }

            const ctx = audioContextRef.current;

            // 2. Connect Source (Runs when media element changes)

            // Disconnect previous source if any
            if (sourceNodeRef.current) {
                try {
                    sourceNodeRef.current.disconnect();
                } catch (e) {
                    console.warn("Error disconnecting old source:", e);
                }
            }

            // Ensure CORS only if not a blob/local file
            if (!media.src.startsWith('blob:') && !media.src.startsWith('data:') && media.crossOrigin !== 'anonymous') {
                media.crossOrigin = 'anonymous';
            }

            // Create new source
            try {
                const source = ctx.createMediaElementSource(media);
                sourceNodeRef.current = source;
                source.connect(preampNodeRef.current);
                connectedElementRef.current = media;
                setIsInitialized(true);
            } catch (err) {
                console.warn("Source creation warning:", err);
                connectedElementRef.current = media;
                setIsInitialized(true);
            }

        } catch (error) {
            console.error("Audio EQ Initialization Failed:", error);
        }
    }, [mediaElementRef, trackId]); // Add trackId dependency to force re-evaluation

    // Apply Gains Helper
    const updateFilterGain = (index, db) => {
        if (filtersRef.current[index] && audioContextRef.current && audioContextRef.current.state !== 'closed') {
            filtersRef.current[index].gain.setTargetAtTime(db, audioContextRef.current.currentTime, 0.1);
        }
    };

    const setBandGain = (index, dbValue) => {
        const newGains = [...gains];
        newGains[index] = dbValue;
        setGains(newGains);
        updateFilterGain(index, dbValue);
    };

    const setPreamp = (dbValue) => {
        setPreampGain(dbValue);
        if (preampNodeRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
            const linear = Math.pow(10, dbValue / 20);
            preampNodeRef.current.gain.setTargetAtTime(linear, audioContextRef.current.currentTime, 0.1);
        }
    };

    const setStereoBalance = (val) => {
        setBalance(val);
        if (balanceNodeRef.current && audioContextRef.current && audioContextRef.current.state !== 'closed') {
            balanceNodeRef.current.pan.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
        }
    };

    const applyPreset = (presetName) => {
        const presetGains = PRESETS[presetName];
        if (presetGains) {
            const newGains = [...presetGains];
            setGains(newGains);
            newGains.forEach((g, i) => updateFilterGain(i, g));
        }
    };

    const resetEq = () => {
        const zeros = new Array(BANDS.length).fill(0);
        setGains(zeros);
        zeros.forEach((g, i) => updateFilterGain(i, g));
        setPreamp(0);
        setStereoBalance(0);
    };

    // Auto-connect when ref changes or updates
    useEffect(() => {
        // Allow DOM to update ref
        const timeout = setTimeout(() => connectAudio(), 50);

        const media = mediaElementRef.current;
        if (media) {
            const handlePlay = () => {
                if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
                    audioContextRef.current.resume().catch(e => console.error("Error resuming audio context:", e));
                }
            };

            // Resume context when play starts/resumes
            media.addEventListener('play', handlePlay);

            return () => {
                clearTimeout(timeout);
                media.removeEventListener('play', handlePlay);
            };
        }
        return () => clearTimeout(timeout);
    }, [mediaElementRef, connectAudio, trackId]);

    // Cleanup Context on Unmount
    useEffect(() => {
        return () => {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.error("Error closing context:", e));
            }
            audioContextRef.current = null; // Important: Nullify ref to prevent reuse of closed context
            connectedElementRef.current = null;
        };
    }, []);

    return {
        isInitialized,
        bands: BANDS,
        gains,
        preampGain,
        balance,
        setBandGain,
        setPreamp,
        setStereoBalance,
        applyPreset,
        resetEq,
    };
};

export default useAudioEqualizer;
