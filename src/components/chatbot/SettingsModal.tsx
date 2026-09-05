// SettingsModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Monitor, Check, LogOut, LogIn, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SettingsModalProps {
    currentTheme: string;
    onThemeChange: (theme: string) => void;
    onClose: () => void;
    userEmail?: string | null;
    onSignOut?: () => void;
    preferredLanguage?: string;
    onPreferredLanguageChange?: (language: string) => void;
}

// Kept in step with SUPPORTED_LANGUAGES in the backend's chat schema.
const LANGUAGE_OPTIONS = [
    { name: 'Ask me each time', value: '' },
    { name: 'Python', value: 'python' },
    { name: 'Java', value: 'java' },
    { name: 'C++', value: 'c++' },
    { name: 'JavaScript', value: 'javascript' },
    { name: 'TypeScript', value: 'typescript' },
    { name: 'Go', value: 'go' },
    { name: 'Rust', value: 'rust' },
    { name: 'C#', value: 'c#' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({
    currentTheme,
    onThemeChange,
    onClose,
    userEmail,
    onSignOut,
    preferredLanguage = '',
    onPreferredLanguageChange,
}) => {

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


                        {/* Solution language: setting this lets the tutor answer
                            immediately instead of asking which language first. */}
                        <div>
                            <label
                                htmlFor="preferred-language"
                                className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider"
                            >
                                Solution language
                            </label>
                            <div className="relative">
                                <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <select
                                    id="preferred-language"
                                    value={preferredLanguage}
                                    onChange={(e) => onPreferredLanguageChange?.(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-teal-500/50"
                                >
                                    {LANGUAGE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                Pick one and solutions arrive in a single step.
                            </p>
                        </div>

                        {/* Account. Until now the app had no sign-out anywhere. */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                                Account
                            </label>
                            {userEmail ? (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-gray-200 truncate">{userEmail}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Chats are saved to your account</p>
                                    </div>
                                    <button
                                        onClick={onSignOut}
                                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-gray-200">Browsing as a guest</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Sign in to save your chat history</p>
                                    </div>
                                    <Link
                                        to="/login"
                                        onClick={onClose}
                                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Sign in
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 text-center text-xs text-gray-400 dark:text-gray-600">
                            CodeQuest101 v2.0
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsModal;