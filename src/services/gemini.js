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
            console.warn(`⚠️ Modelo saturado. Reintentando en ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(model, prompt, retries + 1);
        }
        throw error;
    }
}

export async function generateGeminiRecommendationsLight(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const roleInstruction = userRole
        ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 3 opciones para este rol específico.`
        : "Recomienda 3 opciones de campeones óptimos para completar el equipo aliado.";

    const prompt = `
      Actúa como Coach. Analiza para PARCHE: ${gameVersion || "Más reciente"}.
      CRITERIOS:
      1. Prioriza campeones Meta (Tier S/A) y con buen matchup.
      2. Responde RÁPIDO. Solo nombres y razón breve.
      
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Tarea: ${roleInstruction}
      
      Responde SOLO con un objeto JSON válido:
      {
        "options": [
          {
            "championName": "Nombre",
            "riotId": "ID",
            "reason": "Max 10 palabras sobre por qué es bueno aquí."
          }
        ]
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
            return { ...JSON.parse(jsonString), modelUsed: "gemini-flash" };
        }
        throw new Error("JSON inválido Gemini Light");
    } catch (error) {
        console.error("Gemini Light Error:", error);
        throw error;
    }
}

export async function generateGeminiChampionDetails(apiKey, allyTeam, enemyTeam, championName, gameVersion) {
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
        console.error("Gemini Details Error:", error);
        throw error;
    }
}
