import React, { useMemo, useState, useEffect } from 'react';
import { useChampions } from '../hooks/useChampions';
import { getRecommendations } from '../utils/recommender';
import { generateGeminiRecommendationsLight, generateGeminiChampionDetails, generateGeminiCustomAnalysis, generateGeminiSingleReplacement } from '../services/gemini';
import { generateOpenAIRecommendationsLight, generateOpenAIChampionDetails, generateOpenAICustomAnalysis, generateOpenAISingleReplacement } from '../services/openai';
import { TeamRadar } from './TeamRadar';
import { calculateTeamStats } from '../utils/teamStats';
import { ChampionDetailModal } from './ChampionDetailModal';

export function RecommendationPanel({ allyTeam, enemyTeam, userRole, onRoleChange }) {
    const ROLES = [
        { id: 'Top', label: 'Top', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png' },
        { id: 'Jungle', label: 'Jungle', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png' },
        { id: 'Mid', label: 'Mid', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png' },
        { id: 'ADC', label: 'ADC', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png' },
        { id: 'Support', label: 'Support', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png' },
    ];
    const { champions, items, runes, version } = useChampions();
    // Leer API Keys
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // Versión manual para la IA (Solución a defase API Riot vs Cliente Live)
    const AI_CONTEXT_VERSION = "25.24";


    const [aiLoading, setAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [aiError, setAiError] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [discardedChamps, setDiscardedChamps] = useState([]);

    // Manual Pick Analysis State
    const [customPick, setCustomPick] = useState("");
    const [customAnalysis, setCustomAnalysis] = useState(null);
    const [analysingCustom, setAnalysingCustom] = useState(false);
    const [replacingChamp, setReplacingChamp] = useState(null);

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
                    recommendation = await generateOpenAIRecommendationsLight(openaiKey, allyTeam, enemyTeam, champions, userRole, AI_CONTEXT_VERSION, discardedChamps);
                } catch (e) {
                    errorMsg = `OpenAI Error: ${e.message}`;
                }
            }

            // 2. Fallback a Gemini si OpenAI falló o no hay key
            if (!recommendation && geminiKey) {
                try {
                    recommendation = await generateGeminiRecommendationsLight(geminiKey, allyTeam, enemyTeam, champions, userRole, AI_CONTEXT_VERSION, discardedChamps);
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
                const processedOptions = recommendation.options.map(opt => processAiOption(opt));
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

    const handleSelectOption = async (option) => {
        // 1. Mostrar modal inmediatamente con lo que tenemos
        setSelectedOption(option);

        // Si ya tiene estrategia cargada, no hacemos nada más
        if (option.strategy) return;

        // 2. Cargar detalles (Fase 2)
        setDetailsLoading(true);
        try {
            let details = null;
            // Intentar OpenAI Details
            if (openaiKey) {
                try {
                    details = await generateOpenAIChampionDetails(openaiKey, allyTeam, enemyTeam, option.championName, AI_CONTEXT_VERSION);
                } catch (e) { }
            }
            // Fallback Gemini Details
            if (!details && geminiKey) {
                try {
                    details = await generateGeminiChampionDetails(geminiKey, allyTeam, enemyTeam, option.championName, AI_CONTEXT_VERSION);
                } catch (e) { }
            }

            if (details) {
                const enhancedOption = {
                    ...option,
                    coreBuild: typeof details.build === 'string' ? details.build.split(',').map(s => s.trim()) : [],
                    runes: typeof details.runes === 'string' ? { primary: details.runes.split('+')[0]?.trim(), secondary: details.runes.split('+')[1]?.trim() } : (details.runes || {}),
                    strategy: details.tactics,
                    winCondition: "Estrategia Completa"
                };

                // Actualizar estado general y el seleccionado
                setAiResult(prev => ({
                    ...prev,
                    options: prev.options.map(o => o.championName === option.championName ? enhancedOption : o)
                }));
                setSelectedOption(enhancedOption);
            }
        } catch (error) {
        } finally {
            setDetailsLoading(false);
        }
    };

    const processAiOption = (opt) => {
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const targetName = normalize(opt.championName);
        const riotId = opt.riotId ? normalize(opt.riotId) : null;

        const champData = champions.find(c =>
            (riotId && normalize(c.id) === riotId) ||
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
            const guessId = opt.riotId || opt.championName.replace(/[^a-zA-Z0-9]/g, '');
            finalLoadingImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${guessId}_0.jpg`;
            finalSplashImage = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${guessId}_0.jpg`;
        }

        return {
            ...opt,
            imageId: champData ? champData.id : null,
            imageUrl: finalLoadingImage,
            splashUrl: finalSplashImage,
            coreBuild: [],
            runes: {},
            strategy: null,
            winCondition: null
        };
    };

    const handleDiscard = async (champName) => {
        setReplacingChamp(champName);
        setDiscardedChamps(prev => [...prev, champName]);

        // 1. Filtrar el actual
        const currentOptions = aiResult?.options || [];
        const existingNames = currentOptions.map(o => o.championName);
        // Nota: Mantenemos el filtrado real para el estado final, pero visualmente lo manejaremos con el replacingChamp state
        const filteredOptions = currentOptions.filter(o => o.championName !== champName);
        const filteredExistingNames = filteredOptions.map(o => o.championName);

        try {
            let replacement = null;
            if (openaiKey) {
                try {
                    const result = await generateOpenAISingleReplacement(openaiKey, allyTeam, enemyTeam, userRole, AI_CONTEXT_VERSION, [...discardedChamps, champName], filteredExistingNames);
                    replacement = result.option;
                } catch (e) { }
            }

            if (!replacement && geminiKey) {
                try {
                    const result = await generateGeminiSingleReplacement(geminiKey, allyTeam, enemyTeam, userRole, AI_CONTEXT_VERSION, [...discardedChamps, champName], filteredExistingNames);
                    replacement = result.option;
                } catch (e) { }
            }

            if (replacement) {
                const newOption = processAiOption(replacement);
                setAiResult(prev => ({
                    ...prev,
                    options: [...filteredOptions, newOption]
                }));
            }
        } catch (error) {
        } finally {
            setReplacingChamp(null);
        }
    };

    const handleCustomAnalysis = async (specificPick) => {
        const pickToAnalyze = specificPick || customPick;
        if (!pickToAnalyze.trim()) return;

        setAnalysingCustom(true);
        setCustomAnalysis(null);
        try {
            let result = null;
            if (openaiKey) {
                result = await generateOpenAICustomAnalysis(openaiKey, allyTeam, enemyTeam, pickToAnalyze, AI_CONTEXT_VERSION, userRole);
            } else if (geminiKey) {
                result = await generateGeminiCustomAnalysis(geminiKey, allyTeam, enemyTeam, pickToAnalyze, AI_CONTEXT_VERSION, userRole);
            }
            if (result) setCustomAnalysis(result);
        } catch (e) {
        } finally {
            setAnalysingCustom(false);
        }
    };

    // Efecto para Auto-Consulta con Debounce
    // Serializar IDs para detectar cambios reales en el contenido de los arreglos
    const alliesStr = useMemo(() => allyTeam.map(c => c.id).sort().join(','), [allyTeam]);
    const enemiesStr = useMemo(() => enemyTeam.map(c => c.id).sort().join(','), [enemyTeam]);

    // Efecto para Auto-Consulta con Debounce
    useEffect(() => {
        // Reset de descartes cuando cambia el draft
        setDiscardedChamps([]);
        setCustomAnalysis(null);
        setCustomPick("");

        // Solo activar si hay un rol seleccionado y al menos un campeón en juego
        if (!userRole || (allyTeam.length === 0 && enemyTeam.length === 0)) return;

        const timer = setTimeout(() => {
            handleAiConsult();
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timer);
    }, [alliesStr, enemiesStr, userRole]);

    // Efecto separado para cuando el usuario descarta un campeón (Refresh inmediato)
    // Eliminado porque ahora handleDiscard maneja su propia recarga de 1 campeon
    /*
    useEffect(() => {
        if (discardedChamps.length > 0) {
            handleAiConsult();
        }
    }, [discardedChamps]);
    */

    // Calcular recomendaciones algorítmicas clásicas
    const recommendations = useMemo(() => {
        return getRecommendations(champions, allyTeam, enemyTeam);
    }, [champions, allyTeam, enemyTeam]);


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
                                    🔮 Coach AI
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
                                                ? 'bg-purple-500 shadow-lg scale-110 ring-1 ring-purple-300 z-10'
                                                : 'text-gray-400 hover:bg-white/5 grayscale opacity-70 hover:opacity-100'}`}
                                            title={role.label}
                                        >
                                            <img src={role.icon} alt={role.label} className={`w-6 h-6 object-contain ${userRole === role.id ? '' : 'brightness-75'}`} />
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

                                {aiResult.options.map((option, idx) => {
                                    const isBeingReplaced = replacingChamp === option.championName;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => !isBeingReplaced && handleSelectOption(option)}
                                            className={`bg-black/30 rounded-lg p-3 border border-indigo-500/30 transition-all cursor-pointer flex gap-3 group relative overflow-hidden ${isBeingReplaced ? 'grayscale opacity-50 cursor-wait' : 'hover:bg-black/40 hover:border-indigo-400'}`}
                                        >
                                            {isBeingReplaced && (
                                                <div className="absolute inset-0 bg-indigo-900/10 animate-pulse pointer-events-none flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Reemplazando...</span>
                                                </div>
                                            )}
                                            <div className="shrink-0 relative">
                                                {option.imageUrl ? (
                                                    <img
                                                        src={option.imageUrl}
                                                        alt={option.championName}
                                                        className={`w-14 h-14 rounded-full border-2 border-indigo-400 shadow-md ${!isBeingReplaced && 'group-hover:scale-105'} transition-transform`}
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-full bg-indigo-800 flex items-center justify-center border-2 border-indigo-400">
                                                        <span className="text-xl text-white font-bold">{option.championName[0]}</span>
                                                    </div>
                                                )}
                                                {!isBeingReplaced && (
                                                    <div className="absolute -bottom-1 -right-1 bg-yellow-600 text-[10px] text-white font-bold px-1 rounded-full border border-black shadow-sm">
                                                        Tap
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-white font-bold truncate ${!isBeingReplaced && 'group-hover:text-yellow-400'} transition-colors`}>{option.championName}</h4>
                                                    <div className="flex items-center gap-2">
                                                        {!isBeingReplaced && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDiscard(option.championName);
                                                                }}
                                                                className="text-gray-500 hover:text-red-400 p-1"
                                                                title="No me interesa"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-gray-300 text-xs leading-snug line-clamp-2 opacity-80 group-hover:opacity-100">
                                                    {option.reason}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button onClick={handleAiConsult} className="mt-2 text-[10px] text-purple-300 hover:text-white underline w-full text-center opacity-50">
                                    Refresh Manual
                                </button>
                            </div>
                        )}

                        {/* Analizador de Pick Manual */}
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-3 relative">
                            <h4 className="text-[10px] uppercase font-bold text-purple-200 opacity-70">Evaluación de Pick Manual</h4>
                            <div className="flex gap-2 relative">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={customPick}
                                        onChange={(e) => {
                                            setCustomPick(e.target.value);
                                            setCustomAnalysis(null);
                                        }}
                                        placeholder="Ej: Briar, Sylas..."
                                        className="w-full bg-black/40 border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                                    />

                                    {/* Sugerencias Autocomplete */}
                                    {customPick.length >= 2 && !analysingCustom && !customAnalysis && (
                                        <div className="absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                                            {champions
                                                .filter(c => c.name.toLowerCase().includes(customPick.toLowerCase()))
                                                .slice(0, 8)
                                                .map(champ => (
                                                    <div
                                                        key={champ.id}
                                                        onClick={() => {
                                                            setCustomPick(champ.name);
                                                            handleCustomAnalysis(champ.name);
                                                        }}
                                                        className="flex items-center gap-3 p-2 hover:bg-white/5 cursor-pointer transition-colors"
                                                    >
                                                        <img src={champ.imageUrl} alt={champ.name} className="w-8 h-8 rounded-full border border-gray-600" />
                                                        <span className="text-sm text-gray-200">{champ.name}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleCustomAnalysis}
                                    disabled={analysingCustom || !customPick}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                                >
                                    {analysingCustom ? "..." : "Analizar"}
                                </button>
                            </div>

                            {customAnalysis && (
                                <div className={`p-3 rounded-lg border animate-fade-in ${customAnalysis.isGood ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            {/* Icono del Campeón Analizado */}
                                            {(() => {
                                                const champ = champions.find(c => c.name.toLowerCase() === (customAnalysis.name?.toLowerCase() || customPick.toLowerCase()));
                                                return champ ? (
                                                    <img src={champ.imageUrl} alt={champ.name} className="w-10 h-10 rounded-full border border-white/20 shadow-lg" />
                                                ) : null;
                                            })()}
                                            <div>
                                                <span className={`text-md font-bold uppercase block ${customAnalysis.isGood ? 'text-green-400' : 'text-red-400'}`}>
                                                    {customAnalysis.isGood ? '✅ Buen Pick' : '⚠️ No recomendado'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button onClick={() => setCustomAnalysis(null)} className="text-gray-500 hover:text-white">✕</button>
                                        </div>
                                    </div>
                                    {/* <p className="text-[11px] text-gray-200 leading-tight mb-3">{customAnalysis.reason}</p> */}

                                    {/* Tabla de Pros y Contras */}
                                    <div className="grid grid-cols-2 gap-2 text-[12px] border-t border-white/5 pt-2">
                                        <div className="space-y-1">
                                            <span className="font-bold text-green-400 block mb-1">Pros</span>
                                            {customAnalysis.pros?.map((pro, i) => (
                                                <div key={i} className="flex gap-1 items-start text-gray-300">
                                                    <span className="text-green-500 shrink-0">·</span>
                                                    <span>{pro}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1 border-l border-white/5 pl-2">
                                            <span className="font-bold text-red-400 block mb-1">Contras</span>
                                            {customAnalysis.cons?.map((con, i) => (
                                                <div key={i} className="flex gap-1 items-start text-gray-300">
                                                    <span className="text-red-500 shrink-0">·</span>
                                                    <span>{con}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal de Detalle */}
                        <ChampionDetailModal
                            champion={selectedOption}
                            onClose={() => setSelectedOption(null)}
                            isLoading={detailsLoading}
                            allItems={items}
                            allRunes={runes}
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
