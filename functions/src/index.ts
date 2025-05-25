// functions/src/index.ts
import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import cors from 'cors';
import OpenAI from 'openai';

admin.initializeApp();

// Global options para todas las funciones
setGlobalOptions({
    region: 'us-central1',
    memory: '256MiB',
    minInstances: 0
});

const corsHandler = cors({ origin: true });

// Define tu secreto con:
//   firebase functions:secrets:set openai_key


export const translateJson = onRequest(async (req, res) => {
    return corsHandler(req, res, async () => {
        // 1) Sólo POST
        if (req.method !== 'POST') {
            res.status(405).send('Use POST');
            return;
        }

        // 2) Loguear el payload recibido
        const payload = req.body;
        console.log('translateJson payload:', JSON.stringify(payload));

        // 3) Preparar el prompt sin fences y con sufijos correctos
        const prompt = `
You will receive a simple JSON object whose keys ending in "_es" must contain Spanish text, those ending in "_en" contain English text, and those ending in "_zh" contain Simplified Chinese text.
For each prefix, ensure there are three keys: "<prefix>_es", "<prefix>_en", and "<prefix>_zh", each with its respective translation. Leave the other keys unchanged.
Respond ONLY with the RAW JSON OBJECT. Do not enclose your response in Markdown, backticks, or code fences. Detect the language of the value and translate the others. It may also come without the prefix, so you should consider it for translation and submit the values ​​with prefixes.

INPUT:
${JSON.stringify(payload, null, 2)}
`.trim();

        try {
            const openai = new OpenAI({ apiKey: 'APIKEY' });
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful translator specialized in construction and hospital concessions.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
            });

            // 4) Extraer y sanear la respuesta
            let text = completion.choices?.[0]?.message?.content ?? '';
            text = text.trim();
            if (text.startsWith('```')) {
                text = text
                    .replace(/^```(?:json)?\r?\n/, '')
                    .replace(/\r?\n```$/, '');
            }

            // 5) Parsear y responder
            const translated = JSON.parse(text);
            res.status(200).json(translated);
        } catch (err: any) {
            console.error('translateJson error:', err);
            res.status(500).json({ error: err.message || String(err) });
        }
    });
});