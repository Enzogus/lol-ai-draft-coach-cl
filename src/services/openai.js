
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function generateOpenAIRecommendationsLight(apiKey, allyTeam, enemyTeam, availableChampions, userRole, gameVersion, excludedChamps = []) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");

  const roleInstruction = userRole
    ? `IMPORTANTE: El usuario VA A JUGAR ROL: ${userRole}. Recomienda 4 opciones para este rol específico.`
    : "Recomienda 4 opciones de campeones óptimos para completar el equipo aliado.";

  const systemPrompt = `
      Actúa como un Coach de élite. Analiza para PARCHE: ${gameVersion || "Más reciente"}.
      
      ESTRATEGIA DE RECOMENDACIÓN:
      1. SINERGIA Y COUNTER: Prioriza campeones con mejor SINERGIA con aliados y mejores COUNTERS de enemigos.
      2. DIVERSIDAD DE ARQUETIPO: Las 4 opciones deben ser medianamente distintas entre sí. No des 4 campeones del mismo estilo.
      3. VELOCIDAD: Responde RÁPIDO. Solo nombres y razón breve.
      
      Responde SOLO con un JSON válido:
      {
        "options": [
          {
            "championName": "Nombre",
            "riotId": "ID",
            "reason": "Max 12 palabras. Explica el counter o sinergia clave."
          },
          { "championName": "...", "riotId": "...", "reason": "..." },
          { "championName": "...", "riotId": "...", "reason": "..." },
          { "championName": "...", "riotId": "...", "reason": "..." }
        ]
      }

      REGLA CRÍTICA DE EXCLUSIÓN: 
      NO recomiendes BAJO NINGUNA CIRCUNSTANCIA a estos campeones: [${excludedChamps.join(", ")}].
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
    throw error;
  }
}

export async function generateOpenAICustomAnalysis(apiKey, allyTeam, enemyTeam, customChampion, gameVersion, userRole) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");
  const roleText = userRole ? `jugando como ${userRole}` : "";

  const systemPrompt = `
      Eres un Coach Challenger. Parche: ${gameVersion}.
      Evalúa si ${customChampion} es una buena elección ${roleText} para el equipo aliado.
      Entregame una tabla comparativa con los pros y contras de ${customChampion}.
      
      Output JSON:
      {
         "isGood": true/false,
         "reason": "Explicación breve de por qué encaja o por qué es mala idea (max 60 palabras). Considera sinergias con [${allies}] y counters contra [${enemies}]${userRole ? ` en el rol de ${userRole}` : ""}",
         "pros": ["Pro 1", "Pro 2", "Pro 3"],
         "cons": ["Con 1", "Con 2", "Con 3"]
      }
    `;

  const userPrompt = `
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Pick a evaluar: ${customChampion} ${roleText}
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

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    throw error;
  }
}

export async function generateOpenAISingleReplacement(apiKey, allyTeam, enemyTeam, userRole, gameVersion, excludedChamps = [], existingChamps = []) {
  if (!apiKey) throw new Error("OpenAI API Key no encontrada");

  const allies = allyTeam.map(c => c.name).join(", ");
  const enemies = enemyTeam.map(c => c.name).join(", ");
  const existing = existingChamps.join(", ");
  const excluded = excludedChamps.join(", ");

  const systemPrompt = `
      Actúa como un Coach de élite. Parche: ${gameVersion}.
      Tengo estas 3 recomendaciones actuales: [${existing}].
      Necesito exactamente UNA (1) recomendación adicional para completar la lista de 4.
      
      REGLAS:
      1. NO repitas campeones que ya están sugeridos: [${existing}].
      2. NO sugieras campeones descartados: [${excluded}].
      3. Asegúrate de que este nuevo pick aporte un arquetipo DISTINTO a los ya sugeridos si es posible.
      
      Responde SOLO con un JSON válido:
      {
        "option": {
            "championName": "Nombre",
            "riotId": "ID",
            "reason": "Max 12 palabras. Explica por qué completa bien las opciones anteriores."
        }
      }
    `;

  const userPrompt = `
      Aliados: [${allies}]
      Enemigos: [${enemies}]
      Rol: ${userRole}
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

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    throw error;
  }
}
