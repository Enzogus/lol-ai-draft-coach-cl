
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateOpenAIRecommendation(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  // Contexto
  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");

  const roleInstruction = userRole
    ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 3 opciones para este rol específico.`
    : "Recomienda 3 opciones de campeones óptimos para completar el equipo aliado.";

  const systemPrompt = `
      Actúa como un Coach de élite de League of Legends (Challenger).
      Estás analizando para el PARCHE: ${gameVersion || "Más reciente"}.
      IMPORTANTE: NO recomiendes items eliminados (ej: Míticos antiguos). Usa solo items vigentes en este parche.
      Tu tarea es recomendar 3 opciones de campeones dadas las composiciones de equipos.
      Todos los textos deben estar en ESPAÑOL.
      Debes responder SOLAMENTE con un JSON válido.
    `;

  const userPrompt = `
      Situación del Draft:
      - Mi Equipo (Aliados): [${allies}]
      - Equipo Enemigo: [${enemies}]
      
      Tarea:
      ${roleInstruction}
      
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
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo rápido y eficiente
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" } // Asegura respuesta JSON
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Error en OpenAI API");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return { ...JSON.parse(content), modelUsed: "gpt-4o-mini" };

  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
}
