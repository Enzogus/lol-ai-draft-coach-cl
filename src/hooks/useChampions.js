import { useState, useEffect } from 'react';

const VERSION = '13.24.1';
const LANGUAGE = 'es_ES';
const BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${VERSION}/data/${LANGUAGE}/champion.json`;

export function useChampions() {
    const [champions, setChampions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(BASE_URL)
            .then((res) => {
                if (!res.ok) throw new Error('Error al cargar campeones');
                return res.json();
            })
            .then((data) => {
                // Data Dragon devuelve un objeto { Aatrox: {...}, Ahri: {...} }
                // Lo convertimos a array para fácil iteración
                const championsArray = Object.values(data.data);
                setChampions(championsArray);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return { champions, loading, error };
}
