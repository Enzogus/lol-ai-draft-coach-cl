import { useState, useEffect } from 'react';

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const LANGUAGE = 'es_ES';

export function useChampions() {
    const [champions, setChampions] = useState([]);
    const [items, setItems] = useState({});
    const [itemsById, setItemsById] = useState({});
    const [runes, setRunes] = useState([]);
    const [runesById, setRunesById] = useState({});
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
                const isNormalStoreItemSR = (item) => {
                    const purchasable = item?.gold?.purchasable === true;
                    // inStore puede no existir, si falta se trata como true
                    const inStore = item?.inStore !== false;
                    const notHidden = item?.hideFromAll !== true;
                    const isSR = item?.maps?.["11"] === true;
                    const notChampionLocked = !item?.requiredChampion && !item?.requiredAlly;
                    const notHtmlName = typeof item?.name === "string" && !/[<>]/.test(item.name);

                    return purchasable && inStore && notHidden && isSR && notChampionLocked && notHtmlName;
                };

                const processedItems = {};
                const processedItemsById = {};
                Object.entries(itemsData.data).forEach(([id, item]) => {
                    if (isNormalStoreItemSR(item)) {
                        const itemData = {
                            id,
                            name: item.name,
                            image: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${id}.png`
                        };
                        processedItems[item.name.toLowerCase()] = itemData;
                        processedItemsById[id] = itemData;
                    }
                });

                // 5. Procesar Runas (Flattening para búsqueda por nombre + ID)
                const processedRunes = [];
                const processedRunesById = {};
                runesData.forEach(tree => {
                    // Mapear la RAMA (Style) - Ej: 8000 para Precisión
                    const treeIcon = tree.icon.startsWith('/') ? tree.icon.substring(1) : tree.icon;
                    const treeData = {
                        id: tree.id,
                        name: tree.name,
                        icon: `https://ddragon.leagueoflegends.com/cdn/img/${treeIcon}`
                    };
                    processedRunesById[tree.id] = treeData;
                    processedRunesById[String(tree.id)] = treeData;

                    tree.slots.forEach(slot => {
                        slot.runes.forEach(rune => {
                            const runeIcon = rune.icon.startsWith('/') ? rune.icon.substring(1) : rune.icon;
                            const runeData = {
                                id: rune.id,
                                name: rune.name,
                                icon: `https://ddragon.leagueoflegends.com/cdn/img/${runeIcon}`
                            };
                            processedRunes.push(runeData);
                            processedRunesById[rune.id] = runeData;
                            processedRunesById[String(rune.id)] = runeData;
                        });
                    });
                });

                setChampions(championsArray);
                setItems(processedItems);
                setItemsById(processedItemsById);
                setRunes(processedRunes);
                setRunesById(processedRunesById);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    return { champions, items, itemsById, runes, runesById, version, loading, error };
}
