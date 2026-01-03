import React, { useState } from 'react';
import { useChampions } from '../hooks/useChampions';

export function BanSelector({ selectedBans, onSelect, side }) {
    const { champions } = useChampions();
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChampions = champions.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const handleSelect = (champion) => {
        if (selectedBans.find(b => b.id === champion.id)) {
            onSelect(selectedBans.filter(b => b.id !== champion.id));
        } else if (selectedBans.length < 5) {
            onSelect([...selectedBans, champion]);
            setIsSearching(false);
            setSearchTerm('');
        }
    };

    const borderColor = side === 'ally' ? 'border-blue-500/50' : 'border-red-500/50';

    return (
        <div className="px-4 py-2 bg-black/40 border-b border-white/5">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Bans:</span>
                <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                        const ban = selectedBans[i];
                        return (
                            <div
                                key={i}
                                onClick={() => ban ? handleSelect(ban) : setIsSearching(!isSearching)}
                                className={`w-7 h-7 rounded-sm border ${ban ? borderColor : 'border-gray-800 bg-gray-900/50'} cursor-pointer flex items-center justify-center overflow-hidden transition-all hover:border-gray-600`}
                            >
                                {ban ? (
                                    <img src={ban.imageUrl} alt={ban.name} className="w-full h-full object-cover grayscale opacity-70" />
                                ) : (
                                    <span className="text-[10px] text-gray-700">+</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isSearching && (
                    <div className="flex-1 relative animate-fade-in">
                        <input
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                            placeholder="Ban..."
                            className="w-full bg-gray-800 text-white text-xs border border-gray-600 rounded px-2 py-1 focus:outline-none"
                        />
                        {searchTerm.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 rounded-b shadow-xl z-50 max-h-32 overflow-y-auto mt-1 custom-scrollbar">
                                {filteredChampions.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => handleSelect(c)}
                                        className="flex items-center gap-2 p-1.5 hover:bg-white/5 cursor-pointer"
                                    >
                                        <img src={c.imageUrl} className="w-5 h-5 rounded-full" />
                                        <span className="text-xs text-gray-200">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
