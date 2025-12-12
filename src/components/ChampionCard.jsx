import React from 'react';

const VERSION = '13.24.1';

export function ChampionCard({ champion, onClick, isSelected, isDisabled }) {
    const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/img/champion/${champion.id}.png`;

    return (
        <div
            className={`
        relative flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-200
        ${isSelected
                    ? 'ring-2 ring-yellow-400 bg-gray-700 bg-opacity-50'
                    : 'hover:bg-gray-700 hover:bg-opacity-30'
                }
        ${isDisabled && !isSelected ? 'opacity-40 cursor-not-allowed grayscale' : ''}
      `}
            onClick={!isDisabled ? onClick : undefined}
        >
            <img
                src={imageUrl}
                alt={champion.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
            />
            <span className="mt-2 text-xs text-white text-center font-medium truncate w-full">
                {champion.name}
            </span>
        </div>
    );
}
