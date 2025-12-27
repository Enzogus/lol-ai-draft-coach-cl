import React, { useMemo, useState, useEffect } from 'react';
import { useChampions } from '../hooks/useChampions';
import { getRecommendations } from '../utils/recommender';
import { generateGeminiRecommendation } from '../services/gemini';
import { generateOpenAIRecommendation } from '../services/openai';
import { TeamRadar } from './TeamRadar';
import { calculateTeamStats } from '../utils/teamStats';
import { ChampionDetailModal } from './ChampionDetailModal';

export function RecommendationPanel({ allyTeam, enemyTeam, userRole, onRoleChange }) {
    const ROLES = [
        { id: 'Top', label: 'Top', icon: '🛡️' },
        { id: 'Jungle', label: 'Jungle', icon: '🌲' },
        { id: 'Mid', label: 'Mid', icon: '🔮' },
        { id: 'ADC', label: 'ADC', icon: '🏹' },
        { id: 'Support', label: 'Support', icon: '🤝' },
    ];
    const { champions, version } = useChampions();
    // Leer API Keys
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // Versión manual para la IA (Solución a defase API Riot vs Cliente Live)
    const AI_CONTEXT_VERSION = "25.24";


    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer logic
    useEffect(() => {
        let interval;
        if (aiLoading) {
            setElapsedTime(0); // Reset on start
            const startTime = Date.now();
            interval = setInterval(() => {
                setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
            }, 100);
        }
        return () => clearInterval(interval);
    }, [aiLoading]);

    const handleAiConsult = async () => {
        setAiLoading(true);
        setAiError(null);
        setAiResult(null);

        try {
            let recommendation = null;
            let errorMsg = null;

            // 1. Intentar con OpenAI (Prioridad)
            if (openaiKey) {
                try {
                    console.log("Recomendación OpenAI:", allyTeam, enemyTeam, champions, userRole, AI_CONTEXT_VERSION);
                    recommendation = await generateOpenAIRecommendation(openaiKey, allyTeam, enemyTeam, champions, userRole, AI_CONTEXT_VERSION);
                } catch (e) {
                    console.warn("OpenAI falló, intentando backup Gemini...", e);
                    errorMsg = `OpenAI Error: ${e.message}`;
                }
            }

            // 2. Fallback a Gemini si OpenAI falló o no hay key
            if (!recommendation && geminiKey) {
                try {
                    recommendation = await generateGeminiRecommendation(geminiKey, allyTeam, enemyTeam, champions, userRole, AI_CONTEXT_VERSION);
                    // Marcar que fue response de backup si venía de un fallo
                    if (errorMsg) recommendation.modelUsed = "gemini-flash (backup)";
                } catch (e) {
                    throw new Error(errorMsg ? `${errorMsg} | Gemini Error: ${e.message}` : `Gemini Error: ${e.message}`);
                }
            }

            if (!recommendation) {
                throw new Error("No se pudo obtener recomendación de ninguna IA (Verifica tus API Keys).");
            }

            // Procesar array de opciones
            // Nota: Tanto OpenAI como Gemini ahora devuelven { options: [...] }
            if (recommendation.options && Array.isArray(recommendation.options)) {
                // Función helper para normalizar nombres
                const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

                const processedOptions = recommendation.options.map(opt => {
                    const targetName = normalize(opt.championName);
                    // Si la IA nos dio el ID exacto, úsalo para buscar
                    const riotId = opt.riotId ? normalize(opt.riotId) : null;

                    // Buscar imagen en nuestros datos locales (para el loading art de la lista)
                    const champData = champions.find(c =>
                        (riotId && normalize(c.id) === riotId) || // Match exacto por ID dado por IA
                        normalize(c.name) === targetName ||
                        normalize(c.id) === targetName ||
                        c.name.toLowerCase().includes(opt.championName.toLowerCase())
                    );

                    let finalLoadingImage = null;
                    let finalSplashImage = null;

                    if (champData) {
                        finalLoadingImage = champData.imageUrl;
                        finalSplashImage = champData.splashUrl;
                    } else {
                        // Fallback con el ID que nos dio la IA o el nombre limpiado
                        const guessId = opt.riotId || opt.championName.replace(/[^a-zA-Z0-9]/g, '');
                        finalLoadingImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${guessId}_0.jpg`;
                        finalSplashImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${guessId}_0.jpg`;
                    }

                    return {
                        ...opt,
                        imageId: champData ? champData.id : null,
                        imageUrl: finalLoadingImage, // Para la lista (pequeña)
                        splashUrl: finalSplashImage, // Para el modal (grande) - Construida localmente
                        // Parsear datos comprimidos (Optimizacion de latencia)
                        coreBuild: typeof opt.build === 'string' ? opt.build.split(',').map(s => s.trim()) : (opt.coreBuild || []),
                        runes: typeof opt.runes === 'string' ? { primary: opt.runes.split('+')[0]?.trim(), secondary: opt.runes.split('+')[1]?.trim() } : (opt.runes || {}),
                        strategy: opt.tactics || opt.strategy,
                        winCondition: opt.tactics ? "Ver Estrategia" : opt.winCondition
                    };
                });

                setAiResult({ options: processedOptions, modelUsed: recommendation.modelUsed });

            } else {
                throw new Error("Formato de respuesta IA inesperado (falta array options).");
            }
        } catch (err) {
            setAiError(err.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Efecto para Auto-Consulta con Debounce
    // Serializar IDs para detectar cambios reales en el contenido de los arreglos
    const alliesStr = useMemo(() => allyTeam.map(c => c.id).sort().join(','), [allyTeam]);
    const enemiesStr = useMemo(() => enemyTeam.map(c => c.id).sort().join(','), [enemyTeam]);

    // Efecto para Auto-Consulta con Debounce
    useEffect(() => {
        // Solo activar si hay un rol seleccionado y al menos un campeón en juego
        if (!userRole || (allyTeam.length === 0 && enemyTeam.length === 0)) return;

        console.log("Detectado cambio en equipos/rol, programando consulta IA...");
        const timer = setTimeout(() => {
            handleAiConsult();
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [alliesStr, enemiesStr, userRole]);

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
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="flex items-center gap-2 text-purple-200 animate-pulse mb-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                                    <span className="text-sm font-bold">Analizando... {elapsedTime}s</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-1 overflow-hidden">
                                    <div className="bg-purple-500 h-full animate-[shimmer_2s_infinite] w-1/2"></div>
                                </div>
                            </div>
                        )}

                        {aiError && (
                            <div className="text-red-300 text-sm bg-red-900/50 p-2 rounded border border-red-500/50">
                                {aiError}
                            </div>
                        )}

                        {aiResult && aiResult.options && (
                            <div className="animate-fade-in mt-2 space-y-3">
                                {aiResult.modelUsed && (
                                    <div className="flex justify-between items-center px-1">
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${parseFloat(elapsedTime) < 10 ? 'text-green-300 bg-green-900/30 border-green-500/30' : 'text-yellow-300 bg-yellow-900/30 border-yellow-500/30'
                                            }`}>
                                            ⏱️ {elapsedTime}s
                                        </span>
                                        <span className="text-[10px] text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30">
                                            🤖 {aiResult.modelUsed}
                                        </span>
                                    </div>
                                )}

                                {aiResult.options.map((option, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedOption(option)}
                                        className="bg-black/30 rounded-lg p-3 border border-indigo-500/30 hover:bg-black/40 hover:border-indigo-400 transition-all cursor-pointer flex gap-3 group"
                                    >
                                        <div className="shrink-0 relative">
                                            {option.imageUrl ? (
                                                <img
                                                    src={option.imageUrl}
                                                    alt={option.championName}
                                                    className="w-14 h-14 rounded-full border-2 border-indigo-400 shadow-md group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-full bg-indigo-800 flex items-center justify-center border-2 border-indigo-400">
                                                    <span className="text-xl text-white font-bold">{option.championName[0]}</span>
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 bg-yellow-600 text-[10px] text-white font-bold px-1 rounded-full border border-black shadow-sm">
                                                Tap
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-white font-bold truncate group-hover:text-yellow-400 transition-colors">{option.championName}</h4>
                                                <span className="text-yellow-400 font-bold text-sm bg-black/40 px-1.5 rounded">{option.score} pts</span>
                                            </div>
                                            <p className="text-gray-300 text-xs leading-snug line-clamp-2 opacity-80 group-hover:opacity-100">
                                                {option.reason}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={handleAiConsult} className="mt-3 text-xs text-purple-300 hover:text-white underline w-full text-center">
                                    Re-analizar
                                </button>
                            </div>
                        )}

                        {/* Modal de Detalle */}
                        <ChampionDetailModal
                            champion={selectedOption}
                            onClose={() => setSelectedOption(null)}
                        />

                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
                    </div>
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
