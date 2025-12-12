import React, { useState } from 'react';
import { useChampions } from '../hooks/useChampions';
import { ChampionCard } from './ChampionCard';

// Agregamos props para control de acordeón móvil
export function ChampionSelector({ title, limit, selectedChampions, onSelect, side, isActive = true, onToggle }) {
    const { champions, loading, error } = useChampions();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);

    const ROLES = [
        { id: 'Fighter', label: 'Luchador' },
        { id: 'Tank', label: 'Tanque' },
        { id: 'Mage', label: 'Mago' },
        { id: 'Assassin', label: 'Asesino' },
        { id: 'Support', label: 'Soporte' },
        { id: 'Marksman', label: 'Tirador' },
    ];

    const filteredChampions = champions.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole ? c.tags.includes(selectedRole) : true;
        return matchesSearch && matchesRole;
    });

    const canSelect = selectedChampions.length < limit;

    const handleSelect = (champion) => {
        if (selectedChampions.find(c => c.id === champion.id)) {
            onSelect(selectedChampions.filter(c => c.id !== champion.id));
        } else if (canSelect) {
            onSelect([...selectedChampions, champion]);
        }
    };

    const borderColor = side === 'ally' ? 'border-blue-500' : 'border-red-500';

    if (loading) return <div className="text-white p-4">Cargando campeones...</div>;
    if (error) return <div className="text-red-400 p-4">Error: {error}</div>;

    return (
        // En móvil, la altura depende de si está activo. En desktop (md) siempre es h-full.
        <div className={`flex flex-col bg-gray-900 border-r ${side === 'ally' ? 'border-r-gray-700' : ''} p-4 transition-all duration-300 ${isActive ? 'h-full flex-1' : 'h-auto'}`}>

            {/* Header con Título y Contador - Clickable en Móvil */}
            <div
                className={`flex justify-between items-center mb-2 pb-2 border-b-2 ${borderColor} cursor-pointer md:cursor-default hover:bg-gray-800 md:hover:bg-transparent transition-colors rounded px-2 md:px-0`}
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    {/* Flecha indicadora solo móvil */}
                    <span className="md:hidden text-gray-400 text-xs">
                        {isActive ? '▼' : '▶'}
                    </span>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{title}</h2>
                </div>
                <span className="text-xl text-gray-300 font-mono">
                    {selectedChampions.length} / {limit}
                </span>
            </div>

            {/* Vista Previa en Colapsado (Solo Móvil) */}
            {!isActive && selectedChampions.length > 0 && (
                <div className="flex gap-1 mb-2 px-2 md:hidden overflow-x-auto">
                    {selectedChampions.map(c => (
                        <img
                            key={c.id}
                            src={c.imageUrl}
                            alt={c.name}
                            className={`w-8 h-8 rounded-full border ${borderColor}`}
                        />
                    ))}
                </div>
            )}

            {/* Contenido (Buscador, Filtros, Slots, Grid) - Oculto si no activo en móvil, siempre visible en Desktop */}
            <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${isActive ? 'flex' : 'hidden'} md:flex`}>
                {/* Buscador */}
                <div className="mb-2">
                    <input
                        type="text"
                        placeholder="Buscar campeón..."
                        className="w-full bg-gray-800 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtros de Rol */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedRole(null)}
                        className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${selectedRole === null
                            ? 'bg-yellow-600 text-white font-bold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        Todos
                    </button>
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${selectedRole === role.id
                                ? 'bg-yellow-600 text-white font-bold'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>

                {/* Slots de Selección (Vista rápida de seleccionados) */}
                <div className="flex gap-2 mb-4 h-20 bg-gray-800 rounded p-2 overflow-x-auto shrink-0">
                    {Array.from({ length: limit }).map((_, i) => {
                        const champion = selectedChampions[i];
                        return (
                            <div
                                key={i}
                                className={`
                     w-16 h-16 rounded-full border-2 flex items-center justify-center bg-gray-900 flex-shrink-0
                     ${champion ? borderColor : 'border-gray-700'}
                   `}
                            >
                                {champion ? (
                                    <img
                                        src={champion.imageUrl}
                                        alt={champion.name}
                                        className="w-full h-full rounded-full cursor-pointer hover:opacity-80"
                                        onClick={() => handleSelect(champion)}
                                        title={`Click para remover ${champion.name}`}
                                    />
                                ) : (
                                    <span className="text-gray-600 text-xs">{i + 1}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Grid de Campeones */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-4 gap-x-2 mt-2 ml-2">
                        {filteredChampions.map(champion => {
                            const isSelected = !!selectedChampions.find(c => c.id === champion.id);
                            // Deshabilitar si no está seleccionado y ya llegamos al límite
                            const isDisabled = !isSelected && !canSelect;

                            return (
                                <ChampionCard
                                    key={champion.id}
                                    champion={champion}
                                    isSelected={isSelected}
                                    isDisabled={isDisabled}
                                    onClick={() => handleSelect(champion)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
