import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function generateWithRetry(model, prompt, retries = 0) {
    try {
        return await model.generateContent(prompt);
    } catch (error) {
        const isOverloaded = error.message.includes('503') || error.message.includes('overloaded') || error.message.includes('429');
        if (isOverloaded && retries < MAX_RETRIES) {
            const delay = RETRY_DELAY * (retries + 1); // Backoff exponencial simple
            console.warn(`⚠️ Modelo saturado o límite de tasa (429/503). Reintentando en ${delay / 1000}s... (Intento ${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return generateWithRetry(model, prompt, retries + 1);
        }
        throw error;
    }
}

export async function generateGeminiRecommendation(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Usamos directamente el modelo solicitado por el usuario para máxima velocidad
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Preparar contexto simplificado
    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const roleInstruction = userRole
        ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 3 opciones para este rol específico.`
        : "Recomienda 3 opciones de campeones óptimos para completar el equipo aliado.";

    const prompt = `
      Actúa como un Coach de élite de League of Legends (Challenger).
      Estás analizando para el PARCHE: ${gameVersion || "Más reciente"}.
      IMPORTANTE: NO recomiendes items eliminados. Usa solo items vigentes en este parche.
      
      Situación del Draft:
      - Mi Equipo (Aliados): [${allies}]
      - Equipo Enemigo: [${enemies}]
      
      Tarea:
      ${roleInstruction}
      IMPORTANTE: Todos los textos explicativos (razón, estrategia, condición de victoria) deben estar en ESPAÑOL.
      
      Responde SOLO con un objeto JSON válido con esta estructura exacta:
      {
        "options": [
          {
            "championName": "Nombre Visual",
            "riotId": "ID interno Riot (ej: MonkeyKing)",
            "score": 95,
            "reason": "Max 15 palabras.",
            "tactics": "Max 15 palabras (estrategia y victoria).",
            "build": "Item1, Item2, Item3",
            "runes": "RunaPrincipal + Secundaria"
          },
          ... (2 opciones más)
        ]
      }
    `;

    try {
        // Usamos la función con retry
        const result = await generateWithRetry(model, prompt);
        const response = await result.response;
        const text = response.text();

        // Extracción robusta de JSON
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = text.substring(firstBrace, lastBrace + 1);
            const data = JSON.parse(jsonString);
            return { ...data, modelUsed: "gemini-flash-latest" };
        } else {
            throw new Error("Formato JSON inválido en respuesta");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error(`Error: ${error.message}`);
    }
}
