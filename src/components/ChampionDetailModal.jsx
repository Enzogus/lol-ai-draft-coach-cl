import React from 'react';

export function ChampionDetailModal({ champion, onClose }) {
    if (!champion) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in" style={{ willChange: 'opacity' }}>
            {/* Card Container - Performance Optimized */}
            <div className="relative w-full max-w-md bg-gray-900 rounded-2xl border-2 border-yellow-600/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ willChange: 'transform, opacity' }}>

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
                        className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Strategy */}
                        <div className="col-span-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-gray-400 text-xs font-bold uppercase mb-2">🎯 Estrategia Clave</h4>
                            <p className="text-sm text-white">{champion.strategy || "Juega según tu rol."}</p>
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
                            <ul className="space-y-2">
                                {champion.coreBuild?.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-300 bg-black/30 p-2 rounded">
                                        <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Runes */}
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h4 className="text-pink-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                ⚡ Runas
                            </h4>
                            <div className="space-y-3">
                                <div className="bg-black/30 p-2 rounded">
                                    <span className="text-xs text-gray-400 block mb-1">Principal</span>
                                    <span className="text-sm font-bold text-white">{champion.runes?.primary}</span>
                                </div>
                                <div className="bg-black/30 p-2 rounded">
                                    <span className="text-xs text-gray-400 block mb-1">Secundaria</span>
                                    <span className="text-sm text-gray-300">{champion.runes?.secondary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
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
