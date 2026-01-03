import { useState } from 'react';
import { ChampionSelector } from './components/ChampionSelector';
import { RecommendationPanel } from './components/RecommendationPanel';
import { BanSelector } from './components/BanSelector';
import TitleBar from './components/TitleBar';

export default function App() {
  const [allyTeam, setAllyTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [allyBans, setAllyBans] = useState([]);
  const [enemyBans, setEnemyBans] = useState([]);

  const [showMobileRecs, setShowMobileRecs] = useState(false);
  // Estado para acordeón móvil ('ally' | 'enemy' | null). Inicialmente 'ally' abierto.
  const [mobileActiveSection, setMobileActiveSection] = useState('ally');
  // Rol del usuario (Top, Jungle, Mid, ADC, Support)
  const [userRole, setUserRole] = useState(null);

  // Exponer setters para el LCU Bridge (RecommendationPanel los usará)
  window._syncTeams = (allies, enemies, aBans, eBans) => {
    setAllyTeam(allies || []);
    setEnemyTeam(enemies || []);
    if (aBans) setAllyBans(aBans);
    if (eBans) setEnemyBans(eBans);
  };

  const ROLES = [
    { id: 'Top', label: 'Top', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png' },
    { id: 'Jungle', label: 'Jungle', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png' },
    { id: 'Mid', label: 'Mid', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png' },
    { id: 'ADC', label: 'ADC', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png' },
    { id: 'Support', label: 'Support', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png' },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden relative">
      <TitleBar />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden md:overflow-hidden relative">



        {/* MODAL para Móvil */}
        {showMobileRecs && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col md:hidden animate-fade-in">
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🔮 Coach IA
              </h2>
              <button
                onClick={() => setShowMobileRecs(false)}
                className="text-gray-400 hover:text-white p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden font-inter">
              <RecommendationPanel
                allyTeam={allyTeam}
                enemyTeam={enemyTeam}
                allyBans={allyBans}
                enemyBans={enemyBans}
                userRole={userRole}
                onRoleChange={setUserRole}
              />
            </div>
          </div>
        )}

        {/* Lado Izquierdo: Aliados (Accordion Prop: isActive solo afecta mobile) */}
        <div className={`flex flex-col overflow-hidden w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800 relative z-0 transition-all duration-300 ${mobileActiveSection === 'ally' ? 'flex-1' : 'h-auto'} md:h-full md:flex-1`}>
          <BanSelector selectedBans={allyBans} onSelect={setAllyBans} side="ally" />
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
        <div className="hidden md:block w-full md:w-1/3 h-full bg-gray-900 border-x border-gray-800 relative z-10 shadow-2xl pt-16">
          <RecommendationPanel
            allyTeam={allyTeam}
            enemyTeam={enemyTeam}
            allyBans={allyBans}
            enemyBans={enemyBans}
            userRole={userRole}
            onRoleChange={setUserRole}
          />
        </div>

        {/* Lado Derecho: Enemigos (Accordion Prop) */}
        <div className={`flex flex-col overflow-hidden w-full md:w-1/3 md:border-l border-gray-800 relative z-0 transition-all duration-300 ${mobileActiveSection === 'enemy' ? 'flex-1' : 'h-auto'} md:h-full md:flex-1`}>
          <BanSelector selectedBans={enemyBans} onSelect={setEnemyBans} side="enemy" />
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
                  setAllyBans([]);
                  setEnemyBans([]);
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
    </div>
  );
}
