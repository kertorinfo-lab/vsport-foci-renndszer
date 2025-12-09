export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Csak POST kérés engedélyezett." });
        }

        const { home, draw, away, apiKey } = req.body;

        if (!home || !draw || !away || !apiKey) {
            return res.status(400).json({ error: "Hiányzó adatok." });
        }

        const margin = ((1/home + 1/draw + 1/away) - 1) * 100;

        const prompt = `
        Odds elemzés:
        1: ${home}
        X: ${draw}
        2: ${away}
        Margin: ${margin.toFixed(2)}%

        Adj profi vsport elemzést + egyetlen tippet (1/X/2).
        Röviden és magyarul válaszolj.
        `;

        // **Itt már nem kell node-fetch!** 
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-5.1",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();

        return res.status(200).json({
            margin: margin.toFixed(2),
            tip: data.choices?.[0]?.message?.content || "Hiba történt az AI válasz értelmezésekor."
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
