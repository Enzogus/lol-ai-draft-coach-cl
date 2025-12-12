import React, { useMemo, useState, useEffect } from 'react';
import { useChampions } from '../hooks/useChampions';
import { getRecommendations } from '../utils/recommender';
import { generateGeminiRecommendation } from '../services/gemini';
import { TeamRadar } from './TeamRadar';
import { calculateTeamStats } from '../utils/teamStats';

export function RecommendationPanel({ allyTeam, enemyTeam, userRole, onRoleChange }) {
    const ROLES = [
        { id: 'Top', label: 'Top', icon: '🛡️' },
        { id: 'Jungle', label: 'Jungle', icon: '🌲' },
        { id: 'Mid', label: 'Mid', icon: '🔮' },
        { id: 'ADC', label: 'ADC', icon: '🏹' },
        { id: 'Support', label: 'Support', icon: '🤝' },
    ];
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
            const recommendation = await generateGeminiRecommendation(apiKey, allyTeam, enemyTeam, champions, userRole);

            // Función helper para normalizar nombres (quitar espacios, comillas, etc)
            const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
            const targetName = normalize(recommendation.championName);

            // Búsqueda robusta: Intentar coincidir por Name o ID (ej: "Wukong" vs "MonkeyKing")
            const champData = champions.find(c =>
                normalize(c.name) === targetName ||
                normalize(c.id) === targetName ||
                c.name.toLowerCase().includes(recommendation.championName.toLowerCase()) // Fallback laxo
            );

            // Si encontramos el campeón en nuestros datos actualizados, usamos su imagen pre-calculada
            // Si no, intentamos construirla asumiendo que el nombre de la IA es el ID (arriesgado pero mejor que nada)
            let finalImage = null;
            if (champData) {
                finalImage = champData.imageUrl;
            } else {
                // Fallback extremo: Usar el nombre que nos dio la IA limpiado
                // Ej: "Lee Sin" -> "LeeSin.png"
                const guessId = recommendation.championName.replace(/[^a-zA-Z0-9]/g, '');
                finalImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${guessId}_0.jpg`; // Intentamos loading art que a veces perdona más
            }

            setAiResult({ ...recommendation, imageId: champData ? champData.id : null, imageUrl: finalImage });
        } catch (err) {
            setAiError(err.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Efecto para Auto-Consulta con Debounce
    useEffect(() => {
        // Solo activar si hay un rol seleccionado y al menos un campeón en juego
        if (!userRole || (allyTeam.length === 0 && enemyTeam.length === 0)) return;

        const timer = setTimeout(() => {
            handleAiConsult();
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [allyTeam, enemyTeam, userRole]);

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
                        <div className="flex flex-col gap-3 mb-3">
                            <div className="flex justify-between items-start">
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
                            <h4 className="text-white text-lg flex items-center justify-center gap-2">
                                Selecciona tu rol
                            </h4>

                            {/* Selector de Rol en Panel */}
                            {onRoleChange && (
                                <div className="flex gap-1 justify-between bg-black/20 p-1 rounded-lg">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => onRoleChange(role.id === userRole ? null : role.id)}
                                            className={`p-1.5 rounded-lg transition-all flex-1 flex justify-center items-center ${userRole === role.id
                                                ? 'bg-purple-500 text-white shadow-lg scale-105 ring-1 ring-purple-300'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                            title={role.label}
                                        >
                                            <span className="text-lg">{role.icon}</span>
                                        </button>
                                    ))}
                                </div>
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

                                {/* Predicción de Victoria */}
                                {aiResult.winPrediction && (
                                    <div className="mb-3 bg-black/40 rounded p-2 border border-gray-700">
                                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                                            <span>Probabilidad de Victoria</span>
                                            <span className={`font-bold ${aiResult.winPrediction >= 60 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {aiResult.winPrediction}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${aiResult.winPrediction >= 60 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${aiResult.winPrediction}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1 italic leading-tight">
                                            "{aiResult.winCondition}"
                                        </div>
                                    </div>
                                )}

                                <div className="bg-black/20 p-3 rounded-lg text-sm text-purple-100 leading-relaxed mb-2">
                                    {aiResult.reason}
                                </div>

                                {/* Build y Runas */}
                                {(aiResult.coreBuild || aiResult.runes) && (
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {aiResult.coreBuild && (
                                            <div className="bg-indigo-900/30 p-2 rounded border border-indigo-500/20">
                                                <h5 className="text-xs font-bold text-indigo-300 mb-1">⚔️ Core Build</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {aiResult.coreBuild.map((item, idx) => (
                                                        <span key={idx} className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {aiResult.runes && (
                                            <div className="bg-pink-900/30 p-2 rounded border border-pink-500/20">
                                                <h5 className="text-xs font-bold text-pink-300 mb-1">⚡ Runas</h5>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-[10px] text-gray-200">Main: <b>{aiResult.runes.primary}</b></span>
                                                    <span className="text-[10px] text-gray-400">Sec: {aiResult.runes.secondary}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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

                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 mt-4 ml-4">
                    Análisis de Composición
                </h3>

                {allyTeam.length > 0 ? (
                    <div className="mb-4 bg-gray-800/50 p-2 mx-4 rounded-lg border border-gray-700">
                        <TeamRadar stats={calculateTeamStats(allyTeam)} />
                        <p className="text-[10px] text-center text-gray-500 mt-1">Aliados</p>
                    </div>
                ) : (
                    <div className="mx-4 mb-4 p-4 text-center text-xs text-gray-600 italic border border-gray-700 border-dashed rounded">
                        Selecciona campeones para ver el radar de estadísticas.
                    </div>
                )}

                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 ml-4">
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
