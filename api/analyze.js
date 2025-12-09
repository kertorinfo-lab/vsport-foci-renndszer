import fetch from 'node-fetch';

// FIGYELEM: A KULCSOT A VERCEL KÖRNYEZETI VÁLTOZÓIBÓL VESZI!
// Győződj meg róla, hogy az OPENAI_API_KEY be van állítva a Vercel dashboardodon.
const API_KEY = process.env.OPENAI_API_KEY; 

export default async function (request, response) {
    
    // 1. Kérés metódusának ellenőrzése
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Csak POST kérés engedélyezett.' });
    }

    // 2. API kulcs ellenőrzése
    if (!API_KEY) {
        return response.status(500).json({ error: 'OPENAI_API_KEY hiányzik a szerver beállításaiból.' });
    }
    
    try {
        // 3. Frontend által küldött adatok lekérése (csak a prompt szöveget várjuk)
        const { prompt } = request.body;
        
        if (!prompt) {
            // Ez a 400-as hibaüzenet jelenik meg, ha a frontend üres/hiányos adatot küld
            return response.status(400).json({ error: 'Hiányzó prompt adat.' }); 
        }

        // 4. OpenAI API hívás
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                // A kulcsot itt használja a szerver
                'Authorization': `Bearer ${API_KEY}` 
            },
            body: JSON.stringify({
                model: "gpt-4o", // Modern, gyors modell a feladatra
                messages: [{role: "user", content: prompt}],
                temperature: 0.2, // Alacsonyabb hőmérséklet, szigorúbb, matematikai válaszhoz
                max_completion_tokens: 1000 // Maximális válaszhossz
            })
        });

        const data = await openaiResponse.json();

        // 5. OpenAI hiba kezelése (pl. kulcs érvénytelen)
        if (data.error) {
            console.error("OpenAI API Error:", data.error.message);
            return response.status(502).json({ error: `OpenAI API hiba: ${data.error.message}` });
        }
        
        // 6. Sikeres válasz visszaküldése a frontendnek
        const resultText = data.choices[0].message.content;
        return response.status(200).json({ result: resultText });

    } catch (error) {
        console.error("Server Error:", error);
        return response.status(500).json({ error: `Belső szerverhiba: ${error.message}` });
    }
}
