// functions/src/openai.ts
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import OpenAI from 'openai';



export const translateJson = onRequest(
    { secrets: ['OPENAI_API_KEY'] }, // Especificar secretos aquí es una buena práctica por función
    async (req, res) => {
        // Aplicar CORS aquí si no se hace globalmente o no se pasa como middleware
        const corsHandler = cors({ origin: true }); // Instancia local de CORS
        corsHandler(req, res, async () => {
            // 1) Sólo POST
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed. Please use POST.');
                return;
            }

            // 2) Loguear el payload recibido
            const payload = req.body;
            console.log('translateJson (from openai.ts) received payload:', JSON.stringify(payload));

            // 3) Preparar el prompt
            const prompt = `
You will receive a simple JSON object whose keys ending in "_es" must contain Spanish text, those ending in "_en" contain English text, and those ending in "_zh" contain Simplified Chinese text.
For each prefix, ensure there are three keys: "<prefix>_es", "<prefix>_en", and "<prefix>_zh", each with its respective translation. Leave the other keys unchanged.
Respond ONLY with the RAW JSON OBJECT. Do not enclose your response in Markdown, backticks, or code fences. Detect the language of the value and translate the others. It may also come without the prefix, so you should consider it for translation and submit the values ​​with prefixes.

INPUT:
${JSON.stringify(payload, null, 2)}
`.trim();

            try {
                const apiKey = process.env.OPENAI_API_KEY;
                if (!apiKey) {
                    console.error('CRITICAL: OPENAI_API_KEY secret is not defined in environment variables.');
                    res.status(500).json({ error: 'Server configuration error: OpenAI API key is missing.' });
                    return;
                }
                const openai = new OpenAI({ apiKey: apiKey });

                console.log('Sending request to OpenAI...');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful translator specialized in construction and hospital concessions.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                });

                console.log('Received response from OpenAI.');
                let text = completion.choices?.[0]?.message?.content ?? '';
                text = text.trim();
                if (text.startsWith('```json')) {
                    text = text.substring(7, text.length - 3).trim();
                } else if (text.startsWith('```')) {
                    text = text.substring(3, text.length - 3).trim();
                }

                console.log('Cleaned OpenAI response text:', text);

                try {
                    const translated = JSON.parse(text);
                    console.log('Successfully parsed JSON, sending response.');
                    res.status(200).json(translated);
                } catch (parseError: any) {
                    console.error('Error parsing JSON response from OpenAI:', parseError, 'Raw text was:', text);
                    res.status(500).json({ error: 'Failed to parse translation result from AI.', details: parseError.message });
                }

            } catch (err: any) {
                console.error('Error during OpenAI API call or processing:', err);
                if (err.response) {
                    console.error('OpenAI API Error Status:', err.response.status);
                    console.error('OpenAI API Error Data:', err.response.data);
                    res.status(err.response.status || 500).json({
                        error: 'OpenAI API request failed.',
                        details: err.response.data || err.message
                    });
                } else {
                    res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
                }
            }
        }); // Cierre de corsHandler
    }
);