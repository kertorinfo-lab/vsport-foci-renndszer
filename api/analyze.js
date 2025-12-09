// api/analyze.js
// Vercel Serverless Function, ami a biztonságos API hívást intézi

import fetch from 'node-fetch'; // Vercel Node.js environment

// Itt fér hozzá a Vercelben elrejtett OPENAI_API_KEY-hez
const API_KEY = process.env.OPENAI_API_KEY; 

export default async function (request, response) {
    
    // Kliens oldali hívások kezelése
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!API_KEY) {
        // Hiba, ha a kulcs nincs beállítva a Vercel Environment Variables-ben!
        return response.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
    }
    
    // Lekérjük a klienstől kapott promptot
    const { prompt } = request.body;
    
    if (!prompt) {
        return response.status(400).json({ error: 'Prompt data is missing.' });
    }

    try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                // A kulcsot itt használja a szerver, nem látható a felhasználónak!
                'Authorization': `Bearer ${API_KEY}` 
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{role: "user", content: prompt}],
                temperature: 0.2,
                max_completion_tokens: 300
            })
        });

        const data = await openaiResponse.json();

        if (data.error) {
            console.error("OpenAI API Error:", data.error.message);
            return response.status(502).json({ error: `OpenAI API hiba: ${data.error.message}` });
        }
        
        // Visszaküldjük a választ a kliens oldalra
        const resultText = data.choices[0].message.content;
        return response.status(200).json({ result: resultText });

    } catch (error) {
        console.error("Server Error:", error);
        return response.status(500).json({ error: 'Internal Server Error during AI communication.' });
    }
}
