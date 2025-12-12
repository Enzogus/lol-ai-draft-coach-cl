import { SYNERGIES, COUNTERS, CHAMPION_DAMAGE_TYPE } from '../data/synergies';

export function getRecommendations(allChampions, allyTeam, enemyTeam) {
    // Si no hay campeones cargados o el equipo aliado está lleno, no recomendar
    if (!allChampions.length || allyTeam.length >= 5) return [];

    // Crear mapa de puntajes
    const scores = allChampions.map(champion => {
        // Ignorar si ya está seleccionado en cualquier equipo
        if (allyTeam.find(c => c.id === champion.id) || enemyTeam.find(c => c.id === champion.id)) {
            return null;
        }

        let score = 0;
        let reasons = [];

        // 1. Análisis de Sinergia (Aliados)
        allyTeam.forEach(ally => {
            // Check si el aliado necesita algo que este campeón tiene
            // O si este campeón tiene sinergia con el aliado
            const comboList = SYNERGIES[ally.id] || [];
            if (comboList.includes(champion.id)) {
                score += 15;
                reasons.push(`Buena sinergia con ${ally.name}`);
            }

            // Sinergia inversa: Si el campeón actual lista al aliado
            const myCombos = SYNERGIES[champion.id] || [];
            if (myCombos.includes(ally.id)) {
                score += 10;
                reasons.push(`Complementa a ${ally.name}`);
            }
        });

        // 2. Análisis de Counter (Enemigos)
        enemyTeam.forEach(enemy => {
            // Check si este campeón es counter del enemigo
            // Buscamos en la lista de COUNTERS del enemigo (quién le gana)
            const enemyCounters = COUNTERS[enemy.id] || [];
            if (enemyCounters.includes(champion.id)) {
                score += 20;
                reasons.push(`Counter directo de ${enemy.name}`);
            }

            // También checkeamos si el campeón actual es famoso por ganar al enemigo
            // (Esta lógica es la misma que arriba pero por si definimos la relación al revés en otra tabla futura)
        });

        // 3. Necesidades de Composición (Simplificado)
        const allyRoles = allyTeam.flatMap(c => c.tags);
        const hasTank = allyRoles.includes("Tank");
        const hasMage = allyRoles.includes("Mage") || allyRoles.includes("Support");
        const hasCarry = allyRoles.includes("Marksman") || allyRoles.includes("Assassin") || allyRoles.includes("Fighter");

        if (!hasTank && champion.tags.includes("Tank")) {
            score += 8;
            reasons.push("Tu equipo necesita un Tanque");
        }

        if (!hasMage && champion.tags.includes("Mage")) {
            score += 5;
            reasons.push("Falta daño mágico");
        }

        // Bonus por "S Tier" o Meta (Hardcoded simple)
        // Podríamos agregar una lista de "God Tier"

        return {
            champion,
            score,
            reasons
        };
    }).filter(item => item !== null && item.score > 0);

    // Ordenar por puntaje descendente
    return scores.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5
}
