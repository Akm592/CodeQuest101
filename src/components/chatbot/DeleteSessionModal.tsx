import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface DeleteSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteSessionModal: React.FC<DeleteSessionModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-[#0F1117] border border-gray-200 dark:border-white/10 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mt-16" />

                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 relative z-10 border border-red-500/20">
                            <Trash2 className="w-7 h-7 text-red-600 dark:text-red-500" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">Delete Session?</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 leading-relaxed relative z-10">
                            This conversation will be permanently removed from your history. This action cannot be undone.
                        </p>

                        <div className="flex gap-3 relative z-10">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium transition-colors border border-transparent dark:border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium shadow-lg shadow-red-500/20 transition-all transform active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DeleteSessionModal;
