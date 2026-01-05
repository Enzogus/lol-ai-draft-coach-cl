import React from 'react';

export function ChampionDetailModal({ champion, onClose, isLoading, allItems = {}, allItemsById = {}, allRunes = [], allRunesById = {}, onRefreshBuild, isRefreshingBuild }) {
    if (!champion) return null;
    // Helpers de búsqueda de iconos
    const getItemIcon = (itemName) => {
        const cleanName = itemName.trim().toLowerCase();
        if (allItems[cleanName]) return allItems[cleanName].image;
        const match = Object.values(allItems).find(item =>
            item.name.toLowerCase().includes(cleanName) ||
            cleanName.includes(item.name.toLowerCase())
        );
        return match ? match.image : null;
    };

    const getItemIconById = (itemId) => {
        const match = allItemsById[itemId];
        return match ? match.image : null;
    };

    const getRuneIconById = (runeId) => {
        const match = allRunesById[runeId];
        return match ? match.icon : null;
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
            <div className={`relative w-full max-w-md bg-gray-900 rounded-2xl border-2 border-yellow-600/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 ${isLoading ? 'animate-soft-pulse animate-pulse-glow' : ''}`} style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>

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
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-900">

                    {/* Challenger Build (NUEVO) */}
                    <div className="bg-yellow-600/10 p-4 rounded-xl border border-yellow-600/30 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-yellow-500 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                <span>👑 Challenger Build {champion.challengerBuild && <span className="text-xs text-gray-500 font-normal ml-1">({champion.challengerBuild.summonerName})</span>}</span>
                            </h3>
                            {onRefreshBuild && (
                                <button
                                    onClick={onRefreshBuild}
                                    className="p-1.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors group"
                                    title="Buscar otra build"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {isRefreshingBuild ? (
                            <div className="flex flex-col items-center justify-center py-6 text-yellow-500/80 gap-2 animate-pulse">
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs font-bold tracking-wide">Buscando match reciente...</span>
                            </div>
                        ) : champion.challengerBuild ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {champion.challengerBuild.items.map((itemId, idx) => {
                                        const icon = getItemIconById(itemId);
                                        return (
                                            <div key={idx} className="w-9 h-9 relative">
                                                {icon ? (
                                                    <img src={icon} alt={`item-${itemId}`} className="w-full h-full rounded border border-yellow-600/20" />
                                                ) : (
                                                    <div className="w-full h-full bg-black/40 rounded border border-gray-700 flex items-center justify-center text-[8px]">{itemId}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {champion.challengerBuild.runes && (
                                    <div className="flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-yellow-600/10">
                                        <div className="flex items-center gap-3">
                                            {getRuneIconById(champion.challengerBuild.runes.keystoneId) && (
                                                <img
                                                    src={getRuneIconById(champion.challengerBuild.runes.keystoneId)}
                                                    className="w-7 h-7 object-contain"
                                                    alt="Keystone"
                                                />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Runa Principal</span>
                                                <span className="text-xs font-bold text-yellow-100/90 leading-tight">
                                                    {allRunesById[champion.challengerBuild.runes.keystoneId]?.name || "Keystone"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 border-t border-yellow-600/5 pt-2">
                                            {getRuneIconById(champion.challengerBuild.runes.secondaryId) && (
                                                <img
                                                    src={getRuneIconById(champion.challengerBuild.runes.secondaryId)}
                                                    className="w-6 h-6 object-contain opacity-80"
                                                    alt="Secondary"
                                                />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Rama Secundaria</span>
                                                <span className="text-xs font-bold text-yellow-100/90 leading-tight">
                                                    {allRunesById[champion.challengerBuild.runes.secondaryId]?.name || "Secondary"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 text-xs italic">
                                <p>No se encontró build reciente.</p>
                                <p className="mt-1">Prueba el botón de <span className="text-yellow-500">Refresh</span> para buscar nuevamente.</p>
                            </div>
                        )}
                    </div>

                    {/* Reason Section */}
                    <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                        <h3 className="text-indigo-400 font-bold text-sm mb-2 uppercase tracking-wide">💡 Análisis del Coach</h3>
                        <p className="text-gray-200 leading-relaxed italic text-sm">"{champion.reason}"</p>
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
                            {/* Build & Runes */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* Build IA */}
                                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-indigo-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                        ⚔️ Core Build (Sugerencia AI)
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
                                                            className="w-10 h-10 rounded-lg border border-indigo-600/30 hover:border-indigo-500 transition-all"
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
                                    <div className="grid grid-cols-2 gap-2">
                                        {['primary', 'secondary'].map(type => {
                                            const runeName = champion.runes?.[type];
                                            const icon = getRuneIcon(runeName);
                                            return (
                                                <div key={type} className="bg-black/30 p-2 rounded flex items-center gap-3">
                                                    {icon && (
                                                        <img src={icon} alt={runeName} className="w-8 h-8 object-contain" />
                                                    )}
                                                    <div className="min-w-0">
                                                        <span className="text-[9px] text-gray-500 block uppercase">{type === 'primary' ? 'Sec' : 'Sub'}</span>
                                                        <span className="text-xs font-bold text-white truncate block">{runeName || '---'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Strategy */}
                            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">🎯 Estrategia Clave</h4>
                                <p className="text-sm text-white leading-relaxed">{champion.strategy || "Cargando estrategia..."}</p>
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
