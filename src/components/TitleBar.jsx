import React from 'react';

const TitleBar = () => {
    const handleMinimize = () => {
        window.electronAPI?.minimize();
    };

    const handleMaximize = () => {
        window.electronAPI?.maximize();
    };

    const handleClose = () => {
        window.electronAPI?.close();
    };

    // Solo mostrar si estamos en Electron
    if (!window.electronAPI) return null;

    return (
        <div className="h-8 bg-black/80 flex justify-between items-center select-none border-b border-white/5 title-bar">
            {/* Area de arrastre */}
            <div className="flex-1 h-full flex items-center px-4 drag-region">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    AI Draft Coach - Desktop
                </span>
            </div>

            {/* Controles */}
            <div className="flex h-full no-drag">
                <button
                    onClick={handleMinimize}
                    className="w-10 h-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <svg width="12" height="1" viewBox="0 0 12 1">
                        <rect width="12" height="1" fill="currentColor" />
                    </svg>
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-10 h-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0,0 v10 h10 v-10 z M1,1 h8 v8 h-8 z" fill="currentColor" />
                    </svg>
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center hover:bg-red-600/80 text-gray-400 hover:text-white transition-colors"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0,0 l10,10 M10,0 l-10,10" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
