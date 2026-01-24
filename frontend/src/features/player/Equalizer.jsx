import React, { useState } from 'react';
import { X, RotateCcw, Zap, Speaker, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRESETS } from '../../hooks/useAudioEqualizer';

const Equalizer = ({ isOpen, onClose, equalizer }) => {
    const {
        bands,
        gains,
        setBandGain,
        preampGain,
        setPreamp,
        balance,
        setStereoBalance,
        applyPreset,
        resetEq
    } = equalizer;

    const [activePreset, setActivePreset] = useState('Custom');

    const handlePresetClick = (preset) => {
        applyPreset(preset);
        setActivePreset(preset);
    };

    const handleReset = () => {
        resetEq();
        setActivePreset('Custom');
    };

    const handleBandChange = (index, val) => {
        setBandGain(index, parseFloat(val));
        setActivePreset('Custom');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-50 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-600/20 rounded-lg">
                                <Sliders className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-wide">Audio Equalizer</h2>
                                <p className="text-xs text-gray-400 font-medium">Professional 7-Band EQ</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                        {/* Left Side: Presets & Master Controls */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Presets Grid */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Presets</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(PRESETS).map(preset => (
                                        <button
                                            key={preset}
                                            onClick={() => handlePresetClick(preset)}
                                            className={`text-xs py-2 px-3 rounded-lg border transition-all truncate ${activePreset === preset
                                                    ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/30'
                                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preamp & Balance */}
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Master</h3>

                                {/* Preamp */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Preamp</span>
                                        <span>{(preampGain > 0 ? '+' : '') + preampGain} dB</span>
                                    </div>
                                    <input
                                        type="range" min="-12" max="12" step="1"
                                        value={preampGain}
                                        onChange={(e) => setPreamp(parseInt(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                                    />
                                </div>

                                {/* Balance */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span className="flex items-center gap-1"><Speaker className="w-3 h-3" /> Balance</span>
                                        <span>{balance === 0 ? 'Center' : balance > 0 ? 'R ' + (balance * 100).toFixed(0) : 'L ' + (Math.abs(balance) * 100).toFixed(0)}</span>
                                    </div>
                                    <input
                                        type="range" min="-1" max="1" step="0.1"
                                        value={balance}
                                        onChange={(e) => setStereoBalance(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125"
                                    />
                                    <div className="flex justify-between px-1 text-[10px] text-gray-600 font-bold">
                                        <span>L</span>
                                        <span>R</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all text-sm font-medium group"
                            >
                                <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
                                Reset to Flat
                            </button>
                        </div>

                        {/* Right Side: EQ Sliders */}
                        <div className="lg:col-span-3 bg-black/40 rounded-xl border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 pointer-events-none opacity-10 flex flex-col justify-between py-6 px-4">
                                {[12, 6, 0, -6, -12].map((db, i) => (
                                    <div key={i} className="w-full h-px bg-white relative">
                                        <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[9px] text-white/50 w-4 text-right">{db}dB</span>
                                    </div>
                                ))}
                            </div>

                            {/* Sliders Container */}
                            <div className="flex justify-between items-center h-full gap-2 relative z-10 pl-4 py-2">
                                {bands.map((band, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center h-full group">

                                        {/* dB Value Label */}
                                        <div className="h-6 mb-2 flex items-end">
                                            <span className={`text-[10px] font-mono transition-opacity ${gains[index] !== 0 ? 'text-red-400 font-bold opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}>
                                                {(gains[index] > 0 ? '+' : '') + gains[index]}dB
                                            </span>
                                        </div>

                                        {/* Vertical Range Input */}
                                        <div className="relative flex-1 w-full flex justify-center items-center">
                                            {/* Track Background */}
                                            <div className="absolute w-1.5 h-full bg-[#1a1a1a] rounded-full overflow-hidden">
                                                <div
                                                    className="absolute bottom-0 w-full bg-gradient-to-t from-red-900/40 to-red-500/40 transition-all duration-100"
                                                    style={{
                                                        height: `${((gains[index] + 12) / 24) * 100}%`,
                                                    }}
                                                />
                                            </div>

                                            <input
                                                type="range"
                                                orient="vertical" // Firefox specific, but styling handles standard
                                                min="-12" max="12" step="1"
                                                value={gains[index]}
                                                onChange={(e) => handleBandChange(index, e.target.value)}
                                                className="absolute w-full h-full opacity-0 cursor-pointer z-10 appearance-none"
                                                style={{ WebkitAppearance: 'slider-vertical' }}
                                            />

                                            {/* Custom Thumb (Visual Only - tracks input value) */}
                                            <motion.div
                                                className={`pointer-events-none w-4 h-4 rounded-full border-2 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-colors duration-200 z-0 ${gains[index] !== 0 ? 'bg-red-600 border-white' : 'bg-[#2a2a2a] border-gray-500'}`}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: `${((gains[index] + 12) / 24) * 100}%`,
                                                    marginBottom: '-8px' // Half height to center
                                                }}
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                }}
                                                transition={{ duration: 0.1 }} // subtle pop
                                            />
                                        </div>

                                        {/* Frequency Label */}
                                        <div className="mt-4 text-center">
                                            <div className="text-xs font-bold text-gray-300">
                                                {band.frequency >= 1000 ? (band.frequency / 1000) + 'k' : band.frequency}
                                            </div>
                                            <div className="text-[9px] text-gray-500 uppercase tracking-tighter mt-0.5 max-w-[40px] truncate">
                                                {band.label}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Equalizer;
