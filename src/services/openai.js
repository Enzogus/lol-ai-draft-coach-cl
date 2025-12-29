
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateOpenAIRecommendationsLight(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");

  const roleInstruction = userRole
    ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 3 opciones para este rol específico.`
    : "Recomienda 3 opciones de campeones óptimos para completar el equipo aliado.";

  const systemPrompt = `
      Actúa como un Coach. Analiza para PARCHE: ${gameVersion || "Más reciente"}.
      CRITERIOS:
      1. Responde RÁPIDO. Solo nombres y razón breve.
      
      Responde SOLO con un JSON válido:
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

  const userPrompt = `
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Tarea: ${roleInstruction}
    `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("Error OpenAI Light");
    const data = await response.json();
    return { ...JSON.parse(data.choices[0].message.content), modelUsed: "gpt-4o" };

  } catch (error) {
    console.error("OpenAI Light Error:", error);
    throw error;
  }
}

export async function generateOpenAIChampionDetails(apiKey, allyTeam, enemyTeam, championName, gameVersion) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");

  const systemPrompt = `
      Eres un Coach Challenger. Parche: ${gameVersion}.
      Analiza PROFUNDAMENTE la elección de: ${championName}.
      
      REGLAS PARA ITEMS Y RUNAS:
      1. Usa los NOMBRES OFICIALES EN INGLÉS No los traduzcas.
      2. No recomiendes items eliminados (ej: Míticos antiguos). Solo items vigentes en el parche ${gameVersion}.
      
      Output JSON:
      {
         "tactics": "Estrategia detallada de fase de lineas y teamfights (Max 550 caracteres).",
         "build": "Item1, Item2, Item3 (Nombres en Inglés)",
         "runes": "Runa Principal + Secundaria (Nombres en Inglés)"
      }
    `;

  const userPrompt = `
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Campeón Elegido: ${championName}
    `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error("Error OpenAI Details");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);

  } catch (error) {
    console.error("OpenAI Details Error:", error);
    throw error;
  }
}
