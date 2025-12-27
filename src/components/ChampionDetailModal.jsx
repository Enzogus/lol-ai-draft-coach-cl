import React from 'react';

export function ChampionDetailModal({ champion, onClose, isLoading, allItems = {}, allRunes = [] }) {
    if (!champion) return null;

    // Helpers de búsqueda de iconos
    const getItemIcon = (itemName) => {
        const cleanName = itemName.trim().toLowerCase();
        // Búsqueda exacta inicial
        if (allItems[cleanName]) return allItems[cleanName].image;
        // Búsqueda difusa (por si la IA añade "The" o "Blade of the...")
        const match = Object.values(allItems).find(item =>
            item.name.toLowerCase().includes(cleanName) ||
            cleanName.includes(item.name.toLowerCase())
        );
        return match ? match.image : null;
    };

    const getRuneIcon = (runeName) => {
        if (!runeName) return null;
        const cleanName = runeName.trim().toLowerCase();
        const match = allRunes.find(r =>
            r.name.toLowerCase().includes(cleanName) ||
            cleanName.includes(r.name.toLowerCase())
        );
        return match ? match.icon : null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in" style={{ willChange: 'opacity' }}>
            {/* Card Container - Performance Optimized */}
            <div className={`relative w-full max-w-md bg-gray-900 rounded-2xl border-2 border-yellow-600/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 ${isLoading ? 'animate-rotate-y' : ''}`} style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>

                {/* Header Background Image */}
                <div className="relative h-48 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
                    {/* Usamos splashUrl prioritaria (AI o local) */}
                    {(champion.splashUrl || champion.imageUrl) ? (
                        <img
                            src={champion.splashUrl}
                            alt={champion.championName}
                            className="w-full h-full object-cover object-top"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-4xl">🏆</span>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-20 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                        ✕
                    </button>

                    <div className="absolute bottom-4 left-4 z-20">
                        <h2 className="text-3xl font-bold text-white drop-shadow-md">{champion.championName}</h2>
                        <span className="text-yellow-400 font-bold bg-black/60 px-2 py-0.5 rounded text-sm border border-yellow-500/30">
                            Score: {champion.score}
                        </span>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-900">

                    {/* Reason Section */}
                    <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                        <h3 className="text-indigo-400 font-bold text-sm mb-2 uppercase tracking-wide">💡 Análisis del Coach</h3>
                        <p className="text-gray-200 leading-relaxed italic">"{champion.reason}"</p>
                    </div>

                    {isLoading ? (
                        /* Skeleton para Carga Profunda */
                        <div className="space-y-4 animate-pulse">
                            <div className="flex items-center justify-center py-2">
                                <span className="text-purple-400 text-sm font-bold animate-pulse flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                                    Analizando Matchup en Profundidad...
                                </span>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-xl h-24 border border-gray-700"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-800/50 p-4 rounded-xl h-40 border border-gray-700"></div>
                                <div className="bg-gray-800/50 p-4 rounded-xl h-40 border border-gray-700"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Strategy */}
                                <div className="col-span-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">🎯 Estrategia Clave</h4>
                                    <p className="text-sm text-white">{champion.strategy || "Cargando estrategia..."}</p>
                                </div>

                                {/* Win Condition */}
                                <div className="col-span-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">🏆 Condición de Victoria</h4>
                                    <p className="text-sm text-green-300 font-bold">{champion.winCondition || "Destruir el nexo."}</p>
                                </div>
                            </div>

                            {/* Build & Runes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Build */}
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-yellow-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        ⚔️ Core Build
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {champion.coreBuild?.map((item, idx) => {
                                            const icon = getItemIcon(item);
                                            return (
                                                <div key={idx} className="group relative">
                                                    {icon ? (
                                                        <img
                                                            src={icon}
                                                            alt={item}
                                                            className="w-10 h-10 rounded-lg border border-yellow-600/30 hover:border-yellow-500 transition-all"
                                                            title={item}
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-black/40 rounded-lg border border-gray-700 flex items-center justify-center text-[8px] text-center p-1">
                                                            {item}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Runes */}
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-pink-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        ⚡ Runas
                                    </h4>
                                    <div className="space-y-3">
                                        {['primary', 'secondary'].map(type => {
                                            const runeName = champion.runes?.[type];
                                            const icon = getRuneIcon(runeName);
                                            return (
                                                <div key={type} className="bg-black/30 p-2 rounded flex items-center gap-3">
                                                    {icon && (
                                                        <img src={icon} alt={runeName} className="w-8 h-8 object-contain" />
                                                    )}
                                                    <div>
                                                        <span className="text-[10px] text-gray-400 block uppercase">{type === 'primary' ? 'Principal' : 'Secundaria'}</span>
                                                        <span className="text-sm font-bold text-white">{runeName || '---'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-800/80 border-t border-gray-700 text-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/20"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
