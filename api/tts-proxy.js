// api/tts-proxy.js: This code runs securely on the Vercel server, NOT in the browser.

export default async function handler(req, res) {
    // 1. Ensure only POST requests are processed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Retrieve the text and voiceName sent from the browser
        const { text, voiceName } = req.body;
        
        // 3. CRITICAL: Get the API key securely from Vercel's Environment Variable
        const apiKey = process.env.GEMINI_API_KEY; 
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Server configuration error: API key missing.' });
        }

        // 4. Construct the payload for the Gemini API call
        const payload = {
            contents: [{ parts: [{ text: text }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName || "Kore" }
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        
        // 5. Make the direct API call safely on the server
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        // 6. Send the audio data result back to the browser
        res.status(200).json(result);

    } catch (error) {
        console.error("Serverless Proxy Error:", error.message);
        res.status(500).json({ error: `Failed to process text: ${error.message}` });
    }
}