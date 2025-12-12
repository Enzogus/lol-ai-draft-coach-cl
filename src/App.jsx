import { useState } from 'react';
import { ChampionSelector } from './components/ChampionSelector';
import { RecommendationPanel } from './components/RecommendationPanel';

export default function App() {
  const [allyTeam, setAllyTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);

  return (
    <div className="flex h-screen w-full bg-black overflow-hidden">
      {/* Lado Izquierdo: Aliados (4) */}
      <div className="w-1/3 h-full border-r border-gray-800">
        <ChampionSelector
          title="Aliados"
          limit={4}
          side="ally"
          selectedChampions={allyTeam}
          onSelect={setAllyTeam}
        />
      </div>

      {/* Centro: Recomendador */}
      <div className="w-1/3 h-full bg-gray-900 border-x border-gray-800 relative z-10 shadow-2xl">
        <RecommendationPanel allyTeam={allyTeam} enemyTeam={enemyTeam} />
      </div>

      {/* Lado Derecho: Enemigos (5) */}
      <div className="w-1/3 h-full border-l border-gray-800">
        <ChampionSelector
          title="Enemigos"
          limit={5}
          side="enemy"
          selectedChampions={enemyTeam}
          onSelect={setEnemyTeam}
        />
      </div>
    </div>
  );
}
