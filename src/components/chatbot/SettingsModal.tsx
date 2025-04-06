// SettingsModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { X, Sun, Moon, Laptop } from 'lucide-react';

interface SettingsModalProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentTheme, onThemeChange, onClose }) => {

    const themeOptions = [
        { name: 'Light', value: 'light', icon: Sun },
        { name: 'Dark', value: 'dark', icon: Moon },
        { name: 'System', value: 'system', icon: Laptop },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            onClick={onClose} // Close on backdrop click
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-white/10
                           p-6 rounded-xl shadow-2xl max-w-md w-full relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full text-gray-500 dark:text-gray-400
                               hover:bg-gray-500/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Close settings"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <h2 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-6">
                    Settings
                </h2>

                {/* Theme Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        Appearance
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => onThemeChange(option.value)}
                                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
                                            ${currentTheme === option.value
                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-100/50 dark:bg-gray-700/50'
                                            }`}
                            >
                                <option.icon className={`w-6 h-6 mb-2 ${currentTheme === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                                <span className={`text-xs font-medium ${currentTheme === option.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {option.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                 {/* Add more settings sections here if needed */}
                 {/* Example:
                 <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                         Font Size (Coming Soon)
                     </label>
                      <input type="range" disabled className="w-full" />
                 </div>
                 */}

            </motion.div>
        </motion.div>
    );
};

export default SettingsModal;