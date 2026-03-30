// SettingsModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Check } from 'lucide-react';

interface SettingsModalProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentTheme, onThemeChange, onClose }) => {

    const themeOptions = [
        { name: 'Light', value: 'light', icon: Sun },
        { name: 'Dark', value: 'dark', icon: Moon },
        { name: 'System', value: 'system', icon: Monitor },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -ml-32 -mb-32" />

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/5 relative z-10">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
                            aria-label="Close settings"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 relative z-10 space-y-6">
                        {/* Theme Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                                Appearance
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {themeOptions.map((option) => {
                                    const isActive = currentTheme === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => onThemeChange(option.value)}
                                            className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300
                                                ${isActive
                                                    ? 'bg-teal-500/10 border-teal-500/50 text-teal-600 dark:text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                                                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/10 hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                        >
                                            {isActive && (
                                                <div className="absolute top-2 right-2">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                            <option.icon className={`w-6 h-6 mb-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                                            <span className="text-sm font-medium">
                                                {option.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>



                        <div className="pt-2 text-center text-xs text-gray-400 dark:text-gray-600">
                            CodeQuest101 v2.0 • Build 2024.10.27
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsModal;