import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const apiKey = "AIzaSyDY17z04nAUJgtn8oj80pkeUOaIaEbcBHs";

async function listModelsRaw() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        fs.writeFileSync('models_dump.json', JSON.stringify(data, null, 2));

    } catch (err) {
        fs.writeFileSync('models_dump.json', JSON.stringify({ error: err.message }, null, 2));
        console.error("REST Error:", err);
    }
}

listModelsRaw();
