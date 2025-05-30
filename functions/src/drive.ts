// functions/src/drive.ts
import { google } from 'googleapis';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import Busboy from 'busboy'; // Para parsear multipart/form-data
import * as fs from 'fs';    // File system, para guardar temporalmente el archivo
import * as os from 'os';    // Operating system, para obtener el directorio temporal
import * as path from 'path';  // Para trabajar con rutas de archivos

const getDriveClient = () => {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.error('CRITICAL: Faltan credenciales de Google Cloud en las variables de entorno (secrets).');
        console.error(`GOOGLE_PROJECT_ID: ${projectId ? 'OK' : 'FALTA'}`);
        console.error(`GOOGLE_CLIENT_EMAIL: ${clientEmail ? 'OK' : 'FALTA'}`);
        console.error(`GOOGLE_PRIVATE_KEY: ${privateKey ? 'OK' : 'FALTA'}`);
        throw new Error('Configuración del servidor incompleta: Faltan credenciales para Google Drive.');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            project_id: projectId,
            client_email: clientEmail,
            private_key: privateKey,
        },
        scopes: [
            "https://www.googleapis.com/auth/drive",
        ],
    });

    return google.drive({ version: "v3", auth });
};


const corsHandler = cors({ origin: true });

const driveCorsHandler = cors({ origin: true }); // Handler de CORS específico o global


export const testDriveAuth = onRequest(
    {
        secrets: ['GOOGLE_PROJECT_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
        // region: 'us-central1', // Opcional: si quieres especificar por función
        // memory: '256MiB',    // Opcional
    },
    (req, res) => {
        corsHandler(req, res, async () => { // Aplicamos CORS
            try {
                getDriveClient(); // Intentamos obtener el cliente de Drive
                console.log('testDriveAuth: Autenticación con Google Drive configurada exitosamente.');
                res.status(200).send('Autenticación con Google Drive configurada exitosamente!');
            } catch (error: any) {
                console.error('testDriveAuth: Error al inicializar el cliente de Google Drive:', error);
                res.status(500).send(`Error al inicializar cliente de Drive: ${error.message}`);
            }
        });
    }
);


export const uploadFileToDrive = onRequest(
    {
        secrets: ['GOOGLE_PROJECT_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
        memory: '512MiB',
        timeoutSeconds: 120,
    },
    (req, res) => {
        driveCorsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed. Please use POST.');
                return;
            }

            const busboy = Busboy({ headers: req.headers });
            const tmpdir = os.tmpdir();
            const uploads: { [key: string]: { filepath: string; mimetype: string; filename: string } } = {};
            const fileWrites: Promise<unknown>[] = [];
            const fields: { [key: string]: string } = {}; // Para guardar otros campos del FormData

            // Listener para campos que no son archivos (como targetFolderId)
            busboy.on('field', (fieldname, val) => {
                console.log(`[Drive] Field [${fieldname}]: value: ${val}`);
                fields[fieldname] = val;
            });

            busboy.on('file', (fieldname, file, fileDetails) => {
                const { filename, encoding, mimeType } = fileDetails;
                console.log(`[Drive] File [${fieldname}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`);

                const filepath = path.join(tmpdir, filename);
                // Es importante usar un nombre de archivo único en tmpdir si varios usuarios suben archivos con el mismo nombre al mismo tiempo
                // Podrías prefijar con algo único, ej: const uniqueFilename = `<span class="math-inline">\{Date\.now\(\)\}\-</span>{filename}`;
                // const filepath = path.join(tmpdir, uniqueFilename);
                // uploads[uniqueFilename] = { filepath, mimetype: mimeType, filename }; // Usar uniqueFilename como clave
                uploads[filename] = { filepath, mimetype: mimeType, filename };


                const writeStream = fs.createWriteStream(filepath);
                file.pipe(writeStream);

                const promise = new Promise<void>((resolve, reject) => {
                    file.on('end', () => writeStream.end());
                    writeStream.on('finish', () => resolve());
                    writeStream.on('error', reject);
                });
                fileWrites.push(promise);
            });

            busboy.on('finish', async () => {
                try {
                    await Promise.all(fileWrites);
                    console.log('[Drive] All files written to temp directory.');

                    const drive = getDriveClient();
                    const uploadedFileUrls: { filename: string; url: string; id: string }[] = [];
                    const targetFolderId = fields['targetFolderId']; // Obtener el ID de la carpeta

                    for (const filenameKey of Object.keys(uploads)) {
                        const fileData = uploads[filenameKey];
                        console.log(`[Drive] Uploading ${fileData.filename} to Google Drive...`);

                        const fileMetadata: { name: string; parents?: string[] } = { // Tipar fileMetadata
                            name: fileData.filename,
                        };

                        if (targetFolderId) {
                            fileMetadata.parents = [targetFolderId]; // Asignar la carpeta padre si se proveyó
                            console.log(`[Drive] Target folder ID: ${targetFolderId}`);
                        } else {
                            console.log('[Drive] No target folder ID provided, uploading to root.');
                        }

                        const media = {
                            mimeType: fileData.mimetype,
                            body: fs.createReadStream(fileData.filepath),
                        };

                        const driveResponse = await drive.files.create({
                            requestBody: fileMetadata,
                            media: media,
                            fields: 'id, name, webViewLink, webContentLink',
                        });

                        const fileId = driveResponse.data.id;
                        if (!fileId) {
                            console.error(`[Drive] Failed to get file ID for ${fileData.filename}.`);
                            continue; 
                        }
                        console.log(`[Drive] File ${fileData.filename} uploaded with ID: ${fileId}`);

                        await drive.permissions.create({
                            fileId: fileId,
                            requestBody: {
                                role: 'reader',
                                type: 'anyone',
                            },
                        });
                        console.log(`[Drive] Permissions set for file ID: ${fileId}`);

                        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                        uploadedFileUrls.push({
                            filename: driveResponse.data.name || fileData.filename,
                            url: driveResponse.data.webViewLink || downloadUrl,
                            id: fileId,
                        });

                        fs.unlinkSync(fileData.filepath);
                    }

                    console.log('[Drive] All files processed.');
                    res.status(200).json({
                        message: 'Archivos subidos exitosamente a Google Drive!',
                        files: uploadedFileUrls,
                        targetFolderId: targetFolderId || 'Raíz de Drive',
                    });

                } catch (error: any) {
                    console.error('[Drive] Error during file upload process:', error);
                    for (const filenameKey of Object.keys(uploads)) { // Limpieza en caso de error
                        if (uploads[filenameKey] && fs.existsSync(uploads[filenameKey].filepath)) {
                            fs.unlinkSync(uploads[filenameKey].filepath);
                        }
                    }
                    if (error.message && error.message.includes('Configuración del servidor incompleta')) {
                         res.status(500).json({ error: error.message });
                    } else {
                         res.status(500).json({ error: 'Error interno del servidor al subir archivos.', details: error.message || String(error) });
                    }
                }
            });

            if (req.rawBody) {
                busboy.end(req.rawBody);
            } else {
                req.pipe(busboy);
            }
        });
    }
);
