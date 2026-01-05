import axios from 'axios';

// Configuración de Regiones Riot
const REGION_API = 'la2'; // LAS (puedes cambiar a la1, euw1, na1, etc.)
const REGION_MATCH = 'americas'; // americas, europe, asia

const BASE_URL_API = `https://${REGION_API}.api.riotgames.com/lol`;
const BASE_URL_MATCH = `https://${REGION_MATCH}.api.riotgames.com/lol`;

// Caché simple en memoria para evitar saturar la API
let challengerCache = {
    players: [],
    timestamp: 0
};

const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

async function getChallengerPlayers(apiKey) {
    const now = Date.now();
    if (challengerCache.players.length > 0 && (now - challengerCache.timestamp < CACHE_DURATION)) {
        return challengerCache.players;
    }

    try {
        const response = await axios.get(`${BASE_URL_API}/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`, {
            headers: { "X-Riot-Token": apiKey }
        });

        const players = response.data.entries.sort((a, b) => b.leaguePoints - a.leaguePoints);
        challengerCache = { players, timestamp: now };
        return players;
    } catch (error) {
        console.error("Error fetching Challenger players:", error);
        return [];
    }
}

async function getPuuid(apiKey, summonerId) {
    try {
        const response = await axios.get(`${BASE_URL_API}/summoner/v4/summoners/${summonerId}`, {
            headers: { "X-Riot-Token": apiKey }
        });
        return response.data.puuid;
    } catch (error) {
        return null;
    }
}

async function getRecentMatches(apiKey, puuid) {
    try {
        const response = await axios.get(`${BASE_URL_MATCH}/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`, {
            headers: { "X-Riot-Token": apiKey }
        });
        return response.data;
    } catch (error) {
        return [];
    }
}

async function getMatchDetails(apiKey, matchId) {
    try {
        const response = await axios.get(`${BASE_URL_MATCH}/match/v5/matches/${matchId}`, {
            headers: { "X-Riot-Token": apiKey }
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function getChallengerBuild(apiKey, championName, championId, role) {
    if (!apiKey) {
        console.warn("Riot API Key is missing in getChallengerBuild");
        return null;
    }

    const cleanKey = apiKey.trim();
    console.log("Intentando consulta Riot API con clave:", cleanKey.substring(0, 8) + "...");

    try {
        const players = await getChallengerPlayers(cleanKey);
        console.log("Jugadores encontrados:", players)
        // Tomar una muestra de los top 40 para no saturar la API limit
        const samplePlayers = players.slice(0, 40);

        // Barajar para no siempre mirar a los mismos
        const shuffledPlayers = samplePlayers.sort(() => 0.5 - Math.random());

        for (const player of shuffledPlayers.slice(0, 5)) {
            // El usuario confirmó que ya tiene puuid en el objeto player
            const puuid = player.puuid;
            if (!puuid) continue;

            const matchIds = await getRecentMatches(cleanKey, puuid);

            for (const mId of matchIds) {
                const match = await getMatchDetails(cleanKey, mId);
                if (!match || !match.info) continue;

                const isClassic = match.info.gameMode === 'CLASSIC' && match.info.gameType === 'MATCHED_GAME';
                if (!isClassic) continue;

                const participant = match.info.participants?.find(p =>
                    p.championName.toLowerCase() === championName.toLowerCase() ||
                    p.championId === parseInt(championId)
                );
                if (participant && participant.win) {
                    // Mapeo de Roles de UI a Riot API (TeamPosition)
                    const roleMap = {
                        'top': 'TOP',
                        'jungle': 'JUNGLE',
                        'mid': 'MIDDLE',
                        'adc': 'BOTTOM',
                        'support': 'UTILITY'
                    };

                    const targetPosition = role ? roleMap[role.toLowerCase()] : null;

                    // Filtrar por rol si se especificó
                    const isValidRole = !targetPosition || participant.teamPosition === targetPosition;
                    // Mínimo 15 mins para considerar la build válida
                    const isValidTime = participant.timePlayed > 1500;

                    if (!isValidRole || !isValidTime) continue;

                    console.log("Participante encontrado:", participant);

                    // Extraer items (0-6)
                    const items = [
                        participant.item0, participant.item1, participant.item2,
                        participant.item3, participant.item4, participant.item5,
                        participant.item6
                    ].filter(id => id !== 0);

                    // Extraer Runas (Perks)
                    // perks.styles[0] = Primaria, perks.styles[1] = Secundaria
                    const primaryKeystone = participant.perks?.styles?.[0]?.selections?.[0]?.perk;
                    const secondaryStyle = participant.perks?.styles?.[1]?.style;

                    return {
                        summonerName: participant.riotIdGameName,
                        items,
                        runes: {
                            keystoneId: primaryKeystone,
                            secondaryId: secondaryStyle
                        },
                        kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
                        win: participant.win,
                        matchId: mId
                    };
                }
            }
        }
    } catch (error) {
        console.error("Error in getChallengerBuild:", error);
    }

    return null;
}
