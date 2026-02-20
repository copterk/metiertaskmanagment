import path from 'path';
import { google } from 'googleapis';

const KEY_FILE = path.resolve(__dirname, '../../singular-antler-393106-3293992f9564.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export function getSheetId(): string {
    const id = process.env.GOOGLE_SHEET_ID;
    if (!id) throw new Error('GOOGLE_SHEET_ID is not set in environment variables');
    return id;
}

export async function getSheetsClient() {
    let auth: any;

    // Check for environment variables first (Vercel)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines in env var
            scopes: SCOPES,
        });
    } else {
        // Fallback to local key file
        auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE,
            scopes: SCOPES,
        });
    }
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client as any });
}
