import { getSheetsClient, getSheetId } from './sheetsClient';

// ---- helpers ----

function toRow(obj: Record<string, any>, headers: string[]): any[] {
    return headers.map(h => {
        const v = obj[h];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        return v;
    });
}

function fromRow(row: any[], headers: string[]): Record<string, any> {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
        const raw = row[i] ?? '';
        // Try to parse JSON arrays/objects
        if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
            try { obj[h] = JSON.parse(raw); } catch { obj[h] = raw; }
        } else if (raw === '') {
            obj[h] = undefined;
        } else {
            obj[h] = raw;
        }
    });
    return obj;
}

// ---- sheet config ----

export const SHEETS: Record<string, string[]> = {
    projects: ['id', 'codename', 'name', 'owner', 'status'],
    departments: ['id', 'name'],
    users: ['id', 'name', 'departmentId', 'role', 'status', 'skills', 'capacity'],
    taskTypes: ['id', 'name', 'estimatedHours'],
    tasks: ['id', 'projectId', 'taskTypeId', 'title', 'phases', 'link', 'priority', 'delayReason'],
    activityLog: ['id', 'timestamp', 'entityType', 'entityId', 'action', 'field', 'oldValue', 'newValue', 'userId'],
    taskTemplates: ['id', 'name', 'taskTypeId', 'defaultPhases'],
};

// ---- repository functions ----

export async function getAll(sheet: string): Promise<Record<string, any>[]> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();
    const headers = SHEETS[sheet];

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet}!A1:Z`,
    });

    const rows = res.data.values ?? [];
    if (rows.length <= 1) return []; // only header or empty

    // Skip header row (row index 0)
    return rows.slice(1).map(r => fromRow(r, headers));
}

export async function ensureSheet(sheet: string): Promise<void> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();
    const headers = SHEETS[sheet];

    // Get existing sheets
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existing = meta.data.sheets?.map(s => s.properties?.title) ?? [];

    if (!existing.includes(sheet)) {
        // Create the sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: sheet } } }],
            },
        });
    }

    // Write header row
    const existingValues = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet}!A1:Z1`,
    });
    const firstRow = existingValues.data.values?.[0] ?? [];
    if (firstRow.length === 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheet}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [headers] },
        });
    }
}

export async function appendRow(sheet: string, obj: Record<string, any>): Promise<void> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();
    const headers = SHEETS[sheet];
    const row = toRow(obj, headers);

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheet}!A1`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
}

export async function updateRow(sheet: string, id: string, obj: Record<string, any>): Promise<boolean> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();
    const headers = SHEETS[sheet];

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet}!A1:Z`,
    });

    const rows = res.data.values ?? [];
    // rows[0] = header, rows[1..n] = data
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
    if (rowIndex === -1) return false;

    const sheetRowNumber = rowIndex + 1; // 1-indexed
    const row = toRow(obj, headers);

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet}!A${sheetRowNumber}`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
    });
    return true;
}

export async function deleteRow(sheet: string, id: string): Promise<boolean> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();

    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet}!A1:Z`,
    });

    const rows = res.data.values ?? [];
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
    if (rowIndex === -1) return false;

    // Get sheet GID for batchUpdate
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetMeta = meta.data.sheets?.find(s => s.properties?.title === sheet);
    const sheetId = sheetMeta?.properties?.sheetId;
    if (sheetId === undefined) return false;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex,     // 0-indexed
                        endIndex: rowIndex + 1,
                    },
                },
            }],
        },
    });
    return true;
}

export async function clearAndWriteAll(sheet: string, items: Record<string, any>[]): Promise<void> {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSheetId();
    const headers = SHEETS[sheet];

    const rows = [headers, ...items.map(item => toRow(item, headers))];

    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheet}!A1:Z`,
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: rows },
    });
}
