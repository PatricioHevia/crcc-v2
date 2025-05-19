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
You will be given a plain JSON object whose keys ending in "_es" contain Spanish text,
keys ending in "_en" contain English text, and keys ending in "_zh" contain Simplified Chinese text.
For each prefix, ensure there are three keys: "<prefix>_es", "<prefix>_en", and "<prefix>_zh",
each populated with its respective translation. Leave all other keys unchanged.
Respond with ONLY the RAW JSON OBJECT. DO NOT wrap your response in Markdown, backticks, or code fences.

INPUT:
${JSON.stringify(payload, null, 2)}
`.trim();

        try {
            const openai = new OpenAI({ apiKey: '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' });
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