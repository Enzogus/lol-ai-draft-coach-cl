import { useState } from 'react';
import { ChampionSelector } from './components/ChampionSelector';
import { RecommendationPanel } from './components/RecommendationPanel';

export default function App() {
  const [allyTeam, setAllyTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [showMobileRecs, setShowMobileRecs] = useState(false);
  // Estado para acordeón móvil ('ally' | 'enemy' | null). Inicialmente 'ally' abierto.
  const [mobileActiveSection, setMobileActiveSection] = useState('ally');

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black overflow-hidden md:overflow-hidden relative">



      {/* MODAL para Móvil */}
      {showMobileRecs && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:hidden animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔮 Coach IA
            </h2>
            <button
              onClick={() => setShowMobileRecs(false)}
              className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-full"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <RecommendationPanel allyTeam={allyTeam} enemyTeam={enemyTeam} />
          </div>
        </div>
      )}

      {/* Lado Izquierdo: Aliados (Accordion Prop: isActive solo afecta mobile) */}
      <div className={`flex flex-col overflow-hidden w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800 relative z-0 transition-all duration-300 ${mobileActiveSection === 'ally' ? 'flex-1' : 'h-auto'} md:h-full md:flex-1`}>
        <ChampionSelector
          title="Aliados"
          limit={4}
          side="ally"
          selectedChampions={allyTeam}
          onSelect={setAllyTeam}
          isActive={mobileActiveSection === 'ally'}
          onToggle={() => setMobileActiveSection(mobileActiveSection === 'ally' ? null : 'ally')}
        />
      </div>

      {/* Centro: Recomendador (Desktop: Visible | Mobile: Hidden) */}
      <div className="hidden md:block w-full md:w-1/3 h-full bg-gray-900 border-x border-gray-800 relative z-10 shadow-2xl">
        <RecommendationPanel allyTeam={allyTeam} enemyTeam={enemyTeam} />
      </div>

      {/* Lado Derecho: Enemigos (Accordion Prop) */}
      <div className={`flex flex-col overflow-hidden w-full md:w-1/3 md:border-l border-gray-800 relative z-0 transition-all duration-300 ${mobileActiveSection === 'enemy' ? 'flex-1' : 'h-auto'} md:h-full md:flex-1`}>
        <ChampionSelector
          title="Enemigos"
          limit={5}
          side="enemy"
          selectedChampions={enemyTeam}
          onSelect={setEnemyTeam}
          isActive={mobileActiveSection === 'enemy'}
          onToggle={() => setMobileActiveSection(mobileActiveSection === 'enemy' ? null : 'enemy')}
        />
      </div>

      {/* Quick Actions (Solo Móvil - Visible cuando ambos acordeones están cerrados) */}
      {mobileActiveSection === null && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 animate-fade-in md:hidden bg-gradient-to-b from-gray-900 via-gray-900 to-black">

          <div className="text-center space-y-2">
            <h3 className="text-gray-400 font-medium">Draft Pausado</h3>
            <p className="text-gray-500 text-sm">¿Qué deseas hacer?</p>
          </div>

          <button
            onClick={() => setShowMobileRecs(true)}
            className="w-full max-w-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-lg font-bold py-5 px-8 rounded-2xl shadow-lg border border-purple-400/30 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">🔮</span>
            <span>Ver Coach IA</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de reiniciar el draft?')) {
                setAllyTeam([]);
                setEnemyTeam([]);
                setMobileActiveSection('ally');
              }
            }}
            className="text-gray-400 hover:text-white hover:bg-white/5 py-3 px-6 rounded-xl transition-colors flex items-center gap-2"
          >
            <span>🗑️ Reiniciar Draft</span>
          </button>

        </div>
      )}
    </div>
  );
}
