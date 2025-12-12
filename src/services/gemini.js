import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function generateWithRetry(model, prompt, retries = 0) {
    try {
        return await model.generateContent(prompt);
    } catch (error) {
        const isOverloaded = error.message.includes('503') || error.message.includes('overloaded');
        if (isOverloaded && retries < MAX_RETRIES) {
            console.warn(`⚠️ Modelo saturado (503). Reintentando en ${RETRY_DELAY / 1000}s... (Intento ${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return generateWithRetry(model, prompt, retries + 1);
        }
        throw error;
    }
}

export async function generateGeminiRecommendation(apiKey, allyTeam, enemyTeam, availableChampions) {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Usamos directamente el modelo solicitado por el usuario para máxima velocidad
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Preparar contexto simplificado
    const allies = allyTeam.map(c => c.name).join(", ");
    const enemies = enemyTeam.map(c => c.name).join(", ");

    const prompt = `
      Actúa como un Coach de élite de League of Legends (Challenger).
      
      Situación del Draft:
      - Mi Equipo (Aliados): [${allies}]
      - Equipo Enemigo: [${enemies}]
      
      Tarea:
      Recomienda UN solo campeón óptimo para completar el equipo aliado.
      IMPORTANTE: Todos los textos explicativos (razón, estrategia, condición de victoria) deben estar en ESPAÑOL.
      
      Responde SOLO con un objeto JSON válido con esta estructura exacta:
      {
        "championName": "Nombre exacto del campeón",
        "role": "Posición (Top/Jungle/Mid/ADC/Support)",
        "score": 95,
        "reason": "Explicación estratégica breve (max 2 frases)",
        "strategy": "Consejo táctico clave para la partida",
        "coreBuild": ["Item 1", "Item 2", "Item 3"],
        "runes": {
            "primary": "Nombre Runa Principal",
            "secondary": "Nombre Rama Secundaria"
        },
        "winPrediction": 65,
        "winCondition": "Breve condición de victoria (ej: 'Escalar y pelear en late game')"
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
