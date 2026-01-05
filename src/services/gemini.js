import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function generateWithRetry(model, prompt, retries = 0) {
    try {
        return await model.generateContent(prompt);
    } catch (error) {
        const isOverloaded = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
        if (isOverloaded && retries < MAX_RETRIES) {
            const delay = RETRY_DELAY * (retries + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(model, prompt, retries + 1);
        }
        throw error;
    }
}

export async function generateGeminiRecommendationsLight(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion, excludedChamps = []) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const roleInstruction = userRole
        ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 4 opciones para este rol específico.`
        : "Recomienda 4 opciones de campeones óptimos para completar el equipo aliado.";

    const prompt = `
      Actúa como un Coach de élite. Analiza para PARCHE: ${gameVersion || "Más reciente"}.
      
      ESTRATEGIA DE RECOMENDACIÓN:
      1. SINERGIA Y COUNTER: Prioriza campeones con mejor SINERGIA con aliados y mejores COUNTERS de enemigos. No te limites al meta, busca utilidad real.
      2. DIVERSIDAD DE ARQUETIPO: Ofrece opciones distintas entre sí (ej: mezcla tanques de 'Engage' con campeones de 'Peel' o 'Poke' si la composición lo permite). Evita dar 4 picks del mismo estilo.
      3. VELOCIDAD: Responde RÁPIDO. Solo nombres y razón breve.
      
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Tarea: ${roleInstruction}
      
      Responde SOLO con un objeto JSON válido:
      {
        "options": [
          { "championName": "Nombre", "riotId": "ID", "reason": "Max 12 palabras." },
          { "championName": "...", "riotId": "...", "reason": "..." },
          { "championName": "...", "riotId": "...", "reason": "..." },
          { "championName": "...", "riotId": "...", "reason": "..." }
        ]
      }

      REGLA CRÍTICA DE EXCLUSIÓN: 
      NO recomiendes bajo ningún concepto a estos campeones (incluye BANEOs y DESCARTES): [${excludedChamps.join(", ")}].
    `;

    try {
        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = text.substring(firstBrace, lastBrace + 1);
            return { ...JSON.parse(jsonString), modelUsed: "gemini-flash" };
        }
        throw new Error("JSON inválido Gemini Light");
    } catch (error) {
        throw error;
    }
}

export async function generateGeminiChampionDetails(apiKey, allyTeam, enemyTeam, championName, gameVersion, validItems = []) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const prompt = `
      Eres un Coach Challenger. Parche: ${gameVersion}.
      Analiza PROFUNDAMENTE la elección de: ${championName}.
      
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      
      REGLAS PARA ITEMS Y RUNAS:
      1. Usa los NOMBRES OFICIALES EN INGLÉS (ej: 'Infinity Edge', 'Conqueror'). No los traduzcas.
      2. No recomiendes items eliminados. Solo items vigentes en el parche ${gameVersion}.
      3. REGLA ESTRICTA: SOLO puedes recomendar items que existan en esta lista: [${validItems.join(", ")}]. Si un objeto no está aquí, NO lo menciones.
      
      Output JSON:
      {
         "tactics": "Estrategia detallada de fase de lineas y teamfights (Max 550 caracteres).",
         "build": "Item1, Item2, Item3 (Nombres en Inglés)",
         "runes": "Runa Principal + Secundaria (Nombres en Inglés)"
      }
    `;

    try {
        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = text.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonString);
        }
        throw new Error("JSON inválido Gemini Details");
    } catch (error) {
        throw error;
    }
}

export async function generateGeminiCustomAnalysis(apiKey, allyTeam, enemyTeam, customChampion, gameVersion, userRole) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");
    const roleText = userRole ? `jugando como ${userRole}` : "";

    const prompt = `
      Eres un Coach Challenger. Parche: ${gameVersion}.
      Evalúa si ${customChampion} es una buena elección ${roleText} para el equipo aliado en este draft.
      
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      
      Responde SOLO con un JSON válido:
      {
         "isGood": true/false,
         "reason": "Explicación breve de por qué encaja o por qué es mala idea (max 60 palabras). Considera aliados: [${allies}] y enemigos: [${enemies}]${userRole ? ` para el rol de ${userRole}` : " "}.",
         "pros": ["Pro 1", "Pro 2", "Pro 3"],
         "cons": ["Con 1", "Con 2", "Con 3"]
      }
    `;

    try {
        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = text.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonString);
        }
        throw new Error("JSON inválido Gemini Custom Analysis");
    } catch (error) {
        throw error;
    }
}

export async function generateGeminiSingleReplacement(apiKey, allyTeam, enemyTeam, userRole, gameVersion, excludedChamps = [], existingChamps = []) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");
    const existing = existingChamps.join(", ");
    const excluded = excludedChamps.join(", ");

    const prompt = `
      Eres un Coach de élite. Parche: ${gameVersion}.
      Actualmente tengo estas 3 recomendaciones: [${existing}].
      Necesito exactamente UNA (1) recomendación nueva para completar 4.
      
      REGLAS:
      1. NO repitas campeones en: [${existing}].
      2. NO sugieras campeones en: [${excluded}] (Bans y descartes).
      3. Responde SOLO con un JSON válido.
      
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Rol: ${userRole}

      JSON:
      {
        "option": {
            "championName": "Nombre",
            "riotId": "ID",
            "reason": "Max 12 palabras."
        }
      }
    `;

    try {
        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = text.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonString);
        }
        throw new Error("JSON inválido Gemini Single Replacement");
    } catch (error) {
        throw error;
    }
}
