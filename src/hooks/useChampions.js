import { useState, useEffect } from 'react';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const LANGUAGE = 'es_ES';

export function useChampions() {
    const [champions, setChampions] = useState([]);
    const [items, setItems] = useState({});
    const [runes, setRunes] = useState([]);
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

                // 2. Ejecutar peticiones en paralelo
                const [champsRes, itemsRes, runesRes] = await Promise.all([
                    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/${LANGUAGE}/champion.json`),
                    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/item.json`), // Usamos en_US para match con IA
                    fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/runesReforged.json`)
                ]);

                if (!champsRes.ok || !itemsRes.ok || !runesRes.ok) throw new Error('Error buscando datos estáticos');

                const [champsData, itemsData, runesData] = await Promise.all([
                    champsRes.json(),
                    itemsRes.json(),
                    runesRes.json()
                ]);

                // 3. Procesar campeones e inyectar URLs
                const championsArray = Object.values(champsData.data).map(c => ({
                    ...c,
                    imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${c.id}.png`,
                    splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`
                }));

                // 4. Procesar Items para búsqueda rápida por nombre
                // Data Dragon Item names are unique keys technically, but we use 'name' property
                const processedItems = {};
                Object.entries(itemsData.data).forEach(([id, item]) => {
                    processedItems[item.name.toLowerCase()] = {
                        id,
                        name: item.name,
                        image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${id}.png`
                    };
                });

                // 5. Procesar Runas (Flattening para búsqueda por nombre)
                const processedRunes = [];
                runesData.forEach(tree => {
                    tree.slots.forEach(slot => {
                        slot.runes.forEach(rune => {
                            processedRunes.push({
                                id: rune.id,
                                name: rune.name,
                                icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
                            });
                        });
                    });
                });

                setChampions(championsArray);
                setItems(processedItems);
                setRunes(processedRunes);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { champions, items, runes, version, loading, error };
}
