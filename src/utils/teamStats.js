export function calculateTeamStats(team) {
    const stats = {
        attack: 0,
        magic: 0,
        defense: 0,
        mobility: 0,
        cc: 0
    };

    if (team.length === 0) return stats;

    team.forEach(champ => {
        // DataDragon info: { attack, defense, magic, difficulty }
        if (champ.info) {
            stats.attack += champ.info.attack || 0;
            stats.magic += champ.info.magic || 0;
            stats.defense += champ.info.defense || 0;
        }

        // Heurística basada en tags para stats que no vienen directos (CC/Mobility)
        const tags = champ.tags || [];

        // CC Score
        if (tags.includes("Tank") || tags.includes("Support")) stats.cc += 8;
        if (tags.includes("Mage")) stats.cc += 5;
        if (tags.includes("Fighter")) stats.cc += 3;

        // Mobility Score
        if (tags.includes("Assassin")) stats.mobility += 9;
        if (tags.includes("Fighter") || tags.includes("Marksman")) stats.mobility += 6;
        if (tags.includes("Mage")) stats.mobility += 3;
    });

    // Normalizar a escala 0-100 (aprox)
    // Asumimos un equipo "lleno" son 5 champs. Dividimos y escalamos.
    const maxVal = team.length * 10; // Max teórico aprox por stat base

    return {
        attack: Math.min(100, (stats.attack / maxVal) * 100),
        magic: Math.min(100, (stats.magic / maxVal) * 100),
        defense: Math.min(100, (stats.defense / maxVal) * 100),
        // CC y Mobility son scores arbitrarios, ajustamos escala
        cc: Math.min(100, (stats.cc / (team.length * 8)) * 100),
        mobility: Math.min(100, (stats.mobility / (team.length * 9)) * 100),
    };
}
