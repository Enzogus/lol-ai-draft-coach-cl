import React, { useMemo, useState, useEffect } from 'react';
import { useChampions } from '../hooks/useChampions';
import { getRecommendations } from '../utils/recommender';
import { generateGeminiRecommendation } from '../services/gemini';

export function RecommendationPanel({ allyTeam, enemyTeam }) {
    const { champions } = useChampions();
    // Leer API Key desde variable de entorno (seguro para deploy)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState(null);

    const handleAiConsult = async () => {
        setAiLoading(true);
        setAiError(null);
        setAiResult(null);

        try {
            const recommendation = await generateGeminiRecommendation(apiKey, allyTeam, enemyTeam, champions);
            // Buscar imagen del campeón recomendado
            const champData = champions.find(c => c.name.toLowerCase() === recommendation.championName.toLowerCase());

            // Si encontramos el campeón en nuestros datos actualizados, usamos su imagen pre-calculada
            // Si no (raro), intentamos construirla con una versión fallback o dejamos que falle
            let finalImage = null;
            if (champData) {
                finalImage = champData.imageUrl;
            }

            setAiResult({ ...recommendation, imageId: champData ? champData.id : null, imageUrl: finalImage });
        } catch (err) {
            setAiError(err.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Calcular recomendaciones algorítmicas clásicas
    const recommendations = useMemo(() => {
        return getRecommendations(champions, allyTeam, enemyTeam);
    }, [champions, allyTeam, enemyTeam]);

    // Si no tenemos suficientes datos para recomendar, mensaje inicial
    if (allyTeam.length === 0 && enemyTeam.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center opacity-50">
                <span className="text-4xl mb-4">🧠</span>
                <h3 className="text-xl font-bold mb-2">IA Recomendadora</h3>
                <p>Selecciona campeones aliados y enemigos para ver sugerencias inteligentes.</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-900 border-l border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Recomendaciones
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Sinergias & Counters</p>
                </div>
                {/* Panel de configuración eliminado por solicitud */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

                {/* Sección IA */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-900 border border-indigo-500 shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                🔮 Coach Gemini AI
                            </h3>
                            {!aiLoading && !aiResult && (
                                <button
                                    onClick={handleAiConsult}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-purple-500/50"
                                >
                                    Consultar
                                </button>
                            )}
                        </div>

                        {/* Input eliminado */}

                        {aiLoading && (
                            <div className="flex items-center gap-2 text-purple-200 animate-pulse">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                                <span className="text-sm">Analizando millones de partidas...</span>
                            </div>
                        )}

                        {aiError && (
                            <div className="text-red-300 text-sm bg-red-900/50 p-2 rounded border border-red-500/50">
                                {aiError}
                            </div>
                        )}

                        {aiResult && (
                            <div className="animate-fade-in mt-2">
                                <div className="flex items-center gap-4 mb-3">
                                    {aiResult.imageUrl ? (
                                        <img
                                            src={aiResult.imageUrl}
                                            alt={aiResult.championName}
                                            className="w-16 h-16 rounded-full border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-purple-800 flex items-center justify-center text-2xl font-bold text-white border-2 border-purple-400">
                                            {aiResult.championName[0]}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-2xl font-bold text-white">{aiResult.championName}</h4>
                                        <div className="flex gap-2">
                                            <span className="text-purple-300 text-sm font-mono bg-purple-900/50 px-2 py-0.5 rounded">{aiResult.role} • Score {aiResult.score}</span>
                                            {aiResult.modelUsed && (
                                                <span className="text-xs text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                                                    🤖 {aiResult.modelUsed}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg text-sm text-purple-100 leading-relaxed mb-2">
                                    {aiResult.reason}
                                </div>
                                <div className="flex gap-2 items-center text-xs text-yellow-300 font-bold bg-yellow-900/20 p-2 rounded border border-yellow-700/30">
                                    <span>💡 TIP:</span>
                                    <span>{aiResult.strategy}</span>
                                </div>
                                <button onClick={handleAiConsult} className="mt-3 text-xs text-purple-300 hover:text-white underline w-full text-center">
                                    Re-analizar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                </div>

                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Algoritmo Clasico ({recommendations.length})
                </h3>

                {/* Lista Clásica */}
                {recommendations.map((rec, index) => (
                    <div
                        key={rec.champion.id}
                        className="bg-gray-800 rounded-lg p-3 border border-gray-700 hover:border-gray-500 transition-colors shadow-lg opacity-80 hover:opacity-100"
                    >
                        <div className="flex items-start gap-3">
                            <div className="relative">
                                <img
                                    src={rec.champion.imageUrl}
                                    alt={rec.champion.name}
                                    className="w-12 h-12 rounded-full border border-gray-500 grayscale-[0.3]"
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-gray-200 font-bold text-md leading-none">{rec.champion.name}</h3>
                                    <span className="text-gray-500 font-mono text-xs">Score: {rec.score}</span>
                                </div>

                                <div className="mt-1 space-y-1">
                                    {rec.reasons.slice(0, 1).map((reason, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>• {reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
