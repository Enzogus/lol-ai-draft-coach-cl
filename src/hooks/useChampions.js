import { useState, useEffect } from 'react';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const LANGUAGE = 'es_ES';

export function useChampions() {
    const [champions, setChampions] = useState([]);
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Obtener la última versión
                const versionsRes = await fetch(VERSIONS_URL);
                if (!versionsRes.ok) throw new Error('Error buscando versiones');
                const versions = await versionsRes.json();
                const latestVersion = versions[0];
                setVersion(latestVersion);

                // 2. Obtener campeones de esa versión
                const champsRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/${LANGUAGE}/champion.json`);
                if (!champsRes.ok) throw new Error('Error buscando campeones');
                const champsData = await champsRes.json();

                // 3. Procesar datos e inyectar URLs
                const championsArray = Object.values(champsData.data).map(c => ({
                    ...c,
                    // Pre-calculamos las URLs para no depender de la versión en los componentes hijos
                    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${c.id}.png`,
                    splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`
                }));

                setChampions(championsArray);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { champions, version, loading, error };
}
