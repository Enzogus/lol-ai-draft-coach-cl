import axios from 'axios';

// Groq API Configuration
// Documentation: https://console.groq.com/docs/openai
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b'; // High performance & speed

// ... (code omitted)

export async function generateGroqRecommendationsLight(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion, excludedChamps = []) {
    if (!apiKey) throw new Error("API Key de Groq no proporcionada");

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const roleInstruction = userRole
        ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 4 opciones para este rol específico.`
        : "Recomienda 4 opciones de campeones óptimos para completar el equipo aliado.";

    const systemPrompt = `
      Actúa como un Coach de élite de League of Legends. Analiza para PARCHE: ${gameVersion || "Más reciente"}.
      
      TU ELENCO DE TAREAS ES CRÍTICO:
      Tienes que recomendar 4 campeones para el equipo aliado (o rol específico si se pide).
      NO RECOMIENDES AL AZAR. Tienes que JUSTIFICAR basándote en la composición.
      
      ESTRATEGIA DE RAZONAMIENTO OBLIGATORIA (Cadena de Pensamiento):
      Antes de decidir, analiza internamente:
      1. ¿Qué le falta a mi equipo? (Engage, AP, Frontline, Peel...)
      2. ¿Cuál es la mayor amenaza enemiga y cómo la countereo?
      
      Responde SOLO con un JSON válido que incluya tu análisis táctico previo:
      {
        "tactical_analysis": "Breve resumen de 1 linea sobre qué necesita la composición (Ej: 'Falta tanqueo y magic damage, rivales tienen mucho AD')",
        "options": [
          {
            "championName": "Nombre Exacto",
            "riotId": "ID_Para_Riot",
            "reason": "Menciona EXPLICITAMENTE al aliado o enemigo clave. Ej: 'Ideal con Malphite para wombo'"
          },
          ... (3 opciones más)
        ]
      }

      RESTRICCIONES:
      - NO recomiendes estos campeones (Bans/Picks ya hechos/Descartes): [${excludedChamps.join(", ")}].
      - Razón CORTA y DIRECTA (Max 15 palabras).
    `;

    const userPrompt = `
      CONTEXTO DEL JUEGO:
      -------------------
      ALIADOS (Tu equipo): [${allies || "Ninguno visible"}]
      ENEMIGOS (Equipo rival): [${enemies || "Ninguno visible"}]
      -------------------
      
      TAREA PRIORITARIA:
      ${roleInstruction}
      
      Analiza los matchups y sinergias reales de la lista anterior.
    `;

    try {
        const requestBody = {
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.6,
            max_tokens: 1000
        };

        const response = await axios.post(
            GROQ_API_URL,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;
        console.log(content);

        try {
            // Limpieza agresiva para modelos parlanchines
            let cleanContent = content.trim();
            // 1. Eliminar bloques de código markdown
            cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '');
            // 2. Encontrar el primer '{' y el último '}'
            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
            }

            const parsed = JSON.parse(cleanContent);
            return { ...parsed, modelUsed: DEFAULT_MODEL };
        } catch (parseError) {
            console.warn("Groq JSON Parse Error - Raw Content:", content);
            throw new Error("No se pudo parsear la respuesta de Groq");
        }

    } catch (error) {
        console.error("Error consultando Groq API (Light):", error.response ? error.response.data : error.message);
        throw error;
    }
}


export async function generateGroqChampionDetails(apiKey, allyTeam, enemyTeam, championName, gameVersion, validItems = []) {
    if (!apiKey) throw new Error("API Key de Groq no proporcionada");

    // Construcción del Prompt (Similar a OpenAI/Gemini para consistencia)
    const systemPrompt = `
    Eres un Coach Challenger de League of Legends. Tu tarea es analizar un matchup específico y dar recomendaciones breves y directas.
    
    ESTILO DE RESPUESTA:
    - Formato JSON estricto.
    - NO uses Markdown.
    - NO incluyas explicaciones fuera del JSON.
    - Se conciso y directo (estilo tweet táctico).

    REGLAS PARA ITEMS Y RUNAS:
    1. Usa los NOMBRES OFICIALES EN INGLÉS. No los traduzcas.
    2. No recomiendes items eliminados. Solo items vigentes en el parche ${gameVersion}.
    3. REGLA ESTRICTA: SOLO puedes recomendar items que estén en esta lista: [${validItems.join(", ")}]. Bajo ningún concepto menciones items fuera de ella.
    
    FORMATO JSON ESPERADO:
    {
      "tactics": "Consejo táctico de 1 o 2 frases sobre cómo jugar la línea/matchup.",
      "build": "Item1, Item2, Item3, Item4, Item5, Item6",
      "runes": "RunaPrincipal + RamaSecundaria"
    }
    `;

    const userPrompt = `
    Analiza este escenario de League of Legends:
    - JUEGO COMO: ${championName}
    - MI EQUIPO: ${allyTeam.map(c => c.championName).join(', ') || 'Desconocido'}
    - EQUIPO ENEMIGO: ${enemyTeam.map(c => c.championName).join(', ') || 'Desconocido'}

    Dame la mejor estrategia, build y runas para ganar esta partida.
    `;

    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.5,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;

        try {
            let cleanContent = content.trim();
            // Eliminar bloques de código markdown
            cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '');

            const firstBrace = cleanContent.indexOf('{');
            const lastBrace = cleanContent.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(cleanContent);
        } catch (parseError) {
            console.warn("Groq JSON Parse Error - Raw Content:", content);
            throw new Error("No se pudo parsear la respuesta de Groq");
        }

    } catch (error) {
        console.error("Error consultando Groq API:", error.response ? error.response.data : error.message);
        throw error;
    }
}
