import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { testDriveAuth as driveTestAuth, uploadFileToDrive as driveUploadFile } from './drive'; // <--- MODIFICA ESTA LÍNEA


import { translateJson as openAITranslateJson } from './openai';

admin.initializeApp();

setGlobalOptions({
    region: 'us-central1',
    memory: '256MiB',
    minInstances: 0,

});

export const translateJson = openAITranslateJson;

export const testDriveAuth = driveTestAuth;

export const uploadFileToDrive = driveUploadFile; 
